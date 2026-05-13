import re
from src.safety_db import (
    DRUG_INTERACTIONS, CONTRAINDICATIONS, DRUG_CLASSES,
    AGE_WARNINGS, ALLERGY_MAP, DOSAGE_LIMITS, BRAND_TO_GENERIC,
    SEDATIVE_DRUGS, ANTICHOLINERGIC_DRUGS, ENVIRONMENTAL_IMPACT
)


def normalize_drug_name(name):
    """
    Normalize a drug name: strip whitespace, capitalize properly,
    and resolve brand names to generics where possible.
    Returns (display_name, generic_name) tuple.
    """
    cleaned = name.strip()
    lower = cleaned.lower()

    # Check brand-to-generic mapping
    if lower in BRAND_TO_GENERIC:
        generic = BRAND_TO_GENERIC[lower]
        return cleaned.title(), generic

    return cleaned.title(), cleaned.title()


class ClinicalSafetyEngine:
    def __init__(self, drugs, patient_profile=None):
        """
        :param drugs: List of drug names found in the prescription
        :param patient_profile: Dictionary with keys like 'age', 'allergies', 'conditions'
        """
        # Resolve brand names to generics
        raw_pairs = [normalize_drug_name(d) for d in drugs if d.strip()]
        
        # Deduplicate: If the list contains both a brand (e.g., "Dolo") and its 
        # generic (e.g., "Paracetamol"), remove the generic to avoid double-counting.
        unique_pairs = []
        for i, (disp, gen) in enumerate(raw_pairs):
            is_redundant = False
            for j, (disp2, gen2) in enumerate(raw_pairs):
                if i == j: continue
                # If this item is just the generic name of another item in the list, mark as redundant
                if disp.lower() == gen2.lower() and disp.lower() != disp2.lower():
                    is_redundant = True
                    break
            if not is_redundant:
                unique_pairs.append((disp, gen))
        
        self.drug_pairs = unique_pairs
        self.display_drugs = [pair[0] for pair in self.drug_pairs]
        self.generic_drugs = [pair[1] for pair in self.drug_pairs]
        # Combined set for matching (includes both brand and generic)
        self.all_drug_names = set(self.display_drugs) | set(self.generic_drugs)

        self.profile = patient_profile or {}
        self.alerts = []

    def _drug_in_set(self, drug_name):
        """Case-insensitive check if a drug name matches any in the prescription."""
        drug_lower = drug_name.lower()
        return any(d.lower() == drug_lower for d in self.all_drug_names)

    def check_interactions(self):
        """Check for dangerous drug-drug combinations."""
        for interaction_set, info in DRUG_INTERACTIONS.items():
            if all(self._drug_in_set(d) for d in interaction_set):
                drugs_found = list(interaction_set)
                self.alerts.append({
                    "type": "Drug-Drug Interaction",
                    "severity": info["severity"],
                    "message": info["message"],
                    "involved_drugs": drugs_found,
                    "reason": f"Alert triggered because both {drugs_found[0]} and {drugs_found[1] if len(drugs_found) > 1 else 'another drug'} were found in the prescription. These drugs have a known dangerous interaction in our clinical database."
                })

    def check_contraindications(self):
        """Check if drugs conflict with patient's medical conditions."""
        conditions = self.profile.get("conditions", [])
        if isinstance(conditions, str):
            conditions = [c.strip() for c in conditions.split(",") if c.strip()]

        for condition in conditions:
            for db_condition, info in CONTRAINDICATIONS.items():
                if condition.lower() == db_condition.lower():
                    conflicting_drugs = [d for d in info["drugs"] if self._drug_in_set(d)]
                    if conflicting_drugs:
                        self.alerts.append({
                            "type": "Contraindication",
                            "severity": info["severity"],
                            "message": f"Patient condition ({db_condition}): {info['message']}",
                            "involved_drugs": conflicting_drugs,
                            "reason": f"Alert triggered because patient's medical profile lists '{db_condition}' as an existing condition, and {', '.join(conflicting_drugs)} {'is' if len(conflicting_drugs)==1 else 'are'} known to be contraindicated for this condition."
                        })

    def check_allergy_conflicts(self):
        """Check if prescribed drugs conflict with patient allergies."""
        allergies = self.profile.get("allergies", [])
        if isinstance(allergies, str):
            allergies = [a.strip() for a in allergies.split(",") if a.strip()]

        for allergy in allergies:
            for db_allergy, info in ALLERGY_MAP.items():
                if allergy.lower() == db_allergy.lower():
                    conflicting_drugs = [d for d in info["drugs"] if self._drug_in_set(d)]
                    if conflicting_drugs:
                        self.alerts.append({
                            "type": "Allergy Conflict",
                            "severity": info["severity"],
                            "message": info["message"],
                            "involved_drugs": conflicting_drugs,
                            "reason": f"Alert triggered because patient allergy profile contains '{allergy}', and {', '.join(conflicting_drugs)} {'belongs' if len(conflicting_drugs)==1 else 'belong'} to the {db_allergy} drug family with known cross-reactivity."
                        })
                    break
            else:
                if self._drug_in_set(allergy):
                    self.alerts.append({
                        "type": "Allergy Conflict",
                        "severity": "Critical",
                        "message": f"Patient is allergic to {allergy}, which is present in this prescription.",
                        "involved_drugs": [allergy],
                        "reason": f"Alert triggered because '{allergy}' is listed in the patient's allergy profile and was directly found in the prescribed medications."
                    })

    def check_duplicates(self):
        """Check for duplicate drug classes (e.g., taking two NSAIDs or two acetaminophen products)."""
        found_classes = {}
        for drug in self.all_drug_names:
            for drug_class, drugs_in_class in DRUG_CLASSES.items():
                if any(drug.lower() == d.lower() for d in drugs_in_class):
                    if drug_class not in found_classes:
                        found_classes[drug_class] = set()
                    found_classes[drug_class].add(drug)

        for drug_class, drugs in found_classes.items():
            if len(drugs) > 1:
                # Special high-severity for acetaminophen stacking
                if drug_class == "Acetaminophen":
                    self.alerts.append({
                        "type": "Duplicate Medication",
                        "severity": "Critical",
                        "message": f"⚠️ ACETAMINOPHEN STACKING DETECTED: Multiple paracetamol/acetaminophen-containing drugs ({', '.join(drugs)}) found. Combined use may exceed safe daily limits and cause severe liver toxicity.",
                        "involved_drugs": list(drugs),
                        "reason": f"Alert triggered because {', '.join(drugs)} all contain the same active ingredient (Paracetamol/Acetaminophen). Taking them together risks exceeding the safe daily limit of 4000mg, causing liver damage."
                    })
                else:
                    self.alerts.append({
                        "type": "Duplicate Medication",
                        "severity": "Warning",
                        "message": f"Multiple drugs from the same class ({drug_class}) detected: {', '.join(drugs)}. This may increase risk of side effects.",
                        "involved_drugs": list(drugs),
                        "reason": f"Alert triggered because {', '.join(drugs)} all belong to the {drug_class} drug class. Taking multiple drugs from the same class amplifies side effects without additional benefit."
                    })

    def check_age_warnings(self):
        """Check for age-related medication risks."""
        try:
            age = int(self.profile.get("age", 0))
        except (ValueError, TypeError):
            return

        if age == 0:
            return

        for warning in AGE_WARNINGS:
            if warning["min_age"] <= age <= warning["max_age"]:
                conflicting_drugs = [d for d in warning["drugs"] if self._drug_in_set(d)]
                if conflicting_drugs:
                    age_group = "child" if age < 18 else "elderly patient" if age >= 65 else "adult"
                    self.alerts.append({
                        "type": "Age-Specific Warning",
                        "severity": warning["severity"],
                        "message": f"Patient age ({age}): {warning['message']}",
                        "involved_drugs": conflicting_drugs,
                        "reason": f"Alert triggered because patient age is {age} ({age_group}), which falls in the {warning['min_age']}-{warning['max_age']} age range where {', '.join(conflicting_drugs)} {'has' if len(conflicting_drugs)==1 else 'have'} documented safety concerns."
                    })

    def check_dosage_flags(self, dosage_info=None):
        """
        Check for dosage red flags.
        dosage_info: dict mapping drug name -> dosage string (e.g., {"Paracetamol": "1000mg"})
        """
        if not dosage_info:
            return

        for drug_name, dosage_str in dosage_info.items():
            _, generic = normalize_drug_name(drug_name)
            limit = DOSAGE_LIMITS.get(generic) or DOSAGE_LIMITS.get(drug_name)
            if not limit:
                continue

            # Extract numeric values from dosage string
            nums = re.findall(r'(\d+(?:\.\d+)?)', str(dosage_str))
            if not nums:
                continue

            dose_val = float(nums[0])
            max_single = limit.get("max_single", float('inf'))

            if dose_val > max_single:
                self.alerts.append({
                    "type": "Dosage Red Flag",
                    "severity": "Critical",
                    "message": f"{drug_name} dosage ({dose_val}{limit['unit']}) exceeds maximum single dose of {max_single}{limit['unit']}. Risk of toxicity.",
                    "involved_drugs": [drug_name],
                    "reason": f"Alert triggered because the prescribed dose of {dose_val}{limit['unit']} exceeds the established maximum single dose of {max_single}{limit['unit']} (max daily: {limit.get('max_daily', 'N/A')}{limit['unit']}) per standard pharmacological guidelines."
                })
            elif dose_val > max_single * 0.8:
                self.alerts.append({
                    "type": "Dosage Red Flag",
                    "severity": "Warning",
                    "message": f"{drug_name} dosage ({dose_val}{limit['unit']}) is near the maximum single dose limit of {max_single}{limit['unit']}. Use with caution.",
                    "involved_drugs": [drug_name],
                    "reason": f"Alert triggered because {dose_val}{limit['unit']} is above 80% of the maximum single dose ({max_single}{limit['unit']}). While not exceeding the limit, this leaves little margin for error."
                })

    def analyze_polypharmacy(self):
        """
        Generates 'Discussion Notes for Healthcare Provider'
        regarding excessive medication burden and sedative loads.
        """
        notes = []
        
        # Check Total Pill Burden
        if len(self.all_drug_names) >= 5:
            notes.append({
                "topic": "Excessive Medication Burden (Polypharmacy)",
                "note": f"Patient is prescribed {len(self.all_drug_names)} medications concurrently. This meets the clinical definition of polypharmacy, which is associated with decreased adherence, increased risk of adverse drug events (ADEs), and cognitive impairment in older adults. Consider reviewing the regimen for potential de-prescribing opportunities."
            })
            
        # Check Sedative Load
        sedatives_found = [d for d in self.all_drug_names if any(s.lower() == d.lower() for s in SEDATIVE_DRUGS)]
        if len(sedatives_found) >= 2:
            notes.append({
                "topic": "Cumulative Sedative Load Warning",
                "note": f"Patient is receiving multiple medications with sedative properties ({', '.join(sedatives_found)}). This significantly increases the risk of falls, confusion, and respiratory depression, particularly in elderly patients. Consider dose reductions or alternative therapies."
            })
            
        # Check Anticholinergic Burden
        anticholinergic_found = [d for d in self.all_drug_names if any(a.lower() == d.lower() for a in ANTICHOLINERGIC_DRUGS)]
        if len(anticholinergic_found) >= 2:
            notes.append({
                "topic": "High Anticholinergic Burden",
                "note": f"Identified multiple drugs with anticholinergic effects ({', '.join(anticholinergic_found)}). High burden is linked to cognitive decline, dry mouth, urinary retention, and constipation. Consider minimizing anticholinergic load."
            })

        return notes

    def analyze_environmental_impact(self):
        """
        Generates Green Pharmacy environmental scores.
        """
        impacts = []
        critical_count = 0
        high_count = 0
        
        for drug in self.all_drug_names:
            # Check generic name against DB
            for env_drug, details in ENVIRONMENTAL_IMPACT.items():
                if env_drug.lower() == drug.lower():
                    impacts.append({
                        "drug": drug,
                        "impact": details["impact"],
                        "reason": details["reason"],
                        "disposal": details["disposal"]
                    })
                    if details["impact"] == "Critical": critical_count += 1
                    if details["impact"] == "High": high_count += 1
                    
        overall_score = "Low"
        if impacts:
            if critical_count > 0: overall_score = "Critical"
            elif high_count > 0: overall_score = "High"
            else: overall_score = "Medium"
            
        return {
            "overall_impact": overall_score,
            "drug_impacts": impacts
        }

    def run_all_checks(self, dosage_info=None):
        """Run all safety checks and return structured intelligence dictionary."""
        self.check_interactions()
        self.check_allergy_conflicts()
        self.check_contraindications()
        self.check_duplicates()
        self.check_age_warnings()
        self.check_dosage_flags(dosage_info)

        # Sort: Critical first, then Warning, then Info
        severity_order = {"Critical": 0, "Warning": 1, "Info": 2}
        self.alerts.sort(key=lambda a: severity_order.get(a.get("severity", "Info"), 3))

        polypharmacy_notes = self.analyze_polypharmacy()
        environmental_data = self.analyze_environmental_impact()

        return {
            "alerts": self.alerts,
            "polypharmacy_notes": polypharmacy_notes,
            "environmental": environmental_data
        }


def analyze_safety(drugs, profile=None, dosage_info=None):
    """
    Main entry point for safety analysis.
    :param drugs: List of drug name strings
    :param profile: Patient profile dict (age, allergies, conditions)
    :param dosage_info: Optional dict mapping drug names to dosage strings
    :returns: Dictionary with alerts, polypharmacy, and environmental data
    """
    engine = ClinicalSafetyEngine(drugs, profile)
    return engine.run_all_checks(dosage_info)
