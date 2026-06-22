# Clinical Safety Database for RxLens
# This database contains high-risk interactions, contraindications, drug classes,
# allergy cross-reactivity maps, dosage limits, and age-specific warnings.

# ──────────────────────────────────────────────────────────────────────────────
# DRUG-DRUG INTERACTIONS
# Format: frozenset({drug1, drug2}): { severity, message }
# ──────────────────────────────────────────────────────────────────────────────
DRUG_INTERACTIONS = {
    # --- Bleeding Risk ---
    frozenset({"Aspirin", "Warfarin"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both medications thin the blood — combined they severely increase the risk of dangerous internal bleeding.",
        "suggested_action": "Do not take together. Consult your doctor immediately.",
        "message": "High risk of internal bleeding. These medications should not be taken together without strict medical supervision."
    },
    frozenset({"Aspirin", "Ibuprofen"}): {
        "severity": "Warning",
        "severity_tier": "moderate",
        "why_it_matters": "Both irritate the stomach lining — combined they increase the risk of stomach ulcers and bleeding.",
        "suggested_action": "Avoid combining them if possible, or consult your doctor about taking a stomach protector.",
        "message": "Increased risk of stomach ulcers and bleeding. Ibuprofen may also interfere with Aspirin's heart-protective benefits."
    },
    frozenset({"Aspirin", "Clopidogrel"}): {
        "severity": "Warning",
        "severity_tier": "moderate",
        "why_it_matters": "Both prevent blood clotting — combined they increase your overall bleeding risk.",
        "suggested_action": "Monitor closely for easy bruising or bleeding gums, and inform your doctor.",
        "message": "Dual antiplatelet therapy increases bleeding risk. Monitor for signs of bruising or bleeding."
    },
    frozenset({"Warfarin", "Ibuprofen"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Ibuprofen disrupts the stomach lining while Warfarin thins the blood — combined they dramatically increase bleeding risk.",
        "suggested_action": "Do not mix. Ask your doctor for a safer pain reliever like Paracetamol.",
        "message": "NSAIDs dramatically increase bleeding risk when combined with Warfarin. Avoid this combination."
    },
    frozenset({"Warfarin", "Naproxen"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Naproxen irritates the stomach and Warfarin thins the blood — combined they carry a very high risk of stomach bleeding.",
        "suggested_action": "Avoid this combination completely. Consult your doctor for pain relief alternatives.",
        "message": "Naproxen + Warfarin significantly increases the risk of GI bleeding."
    },

    # --- Cardiac Risk ---
    frozenset({"Sildenafil", "Nitroglycerin"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both strongly lower blood pressure — combined they can cause a sudden, fatal drop in blood pressure.",
        "suggested_action": "Never take together. Seek emergency help if taken together and you feel dizzy or faint.",
        "message": "Dangerous drop in blood pressure. This combination can be fatal."
    },
    frozenset({"Azithromycin", "Amiodarone"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both affect the heart's electrical system — combined they can trigger life-threatening irregular heartbeats.",
        "suggested_action": "Do not take together. Contact your doctor immediately to change the antibiotic.",
        "message": "Risk of serious heart rhythm disturbances (QT prolongation). Can cause fatal arrhythmia."
    },
    frozenset({"Ciprofloxacin", "Amiodarone"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both drugs alter the heart's rhythm — combined they increase the risk of a dangerous irregular heartbeat.",
        "suggested_action": "Consult your doctor immediately for an alternative antibiotic.",
        "message": "Both drugs prolong the QT interval. Combined use risks life-threatening cardiac arrhythmia."
    },
    frozenset({"Metoprolol", "Verapamil"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both slow down the heart rate — combined they can cause the heart to beat dangerously slowly.",
        "suggested_action": "Consult your doctor urgently; your dosages may need close monitoring or adjustment.",
        "message": "Both drugs slow heart rate. Combined use can cause severe bradycardia or heart block."
    },
    frozenset({"Atenolol", "Verapamil"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both reduce heart rate and blood pressure — combined they can cause a severe drop in heart rate.",
        "suggested_action": "Consult your doctor urgently before taking both.",
        "message": "Combined beta-blocker and calcium channel blocker can cause dangerous bradycardia."
    },
    frozenset({"Digoxin", "Amiodarone"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Amiodarone causes Digoxin to build up in the body — combined they can lead to Digoxin poisoning.",
        "suggested_action": "Consult your doctor immediately to adjust the Digoxin dosage.",
        "message": "Amiodarone increases Digoxin levels, risking toxicity. Digoxin dose must be reduced."
    },

    # --- Metabolic Risk ---
    frozenset({"Metformin", "Alcohol"}): {
        "severity": "Warning",
        "severity_tier": "moderate",
        "why_it_matters": "Both strain the liver and alter metabolism — combined they risk a serious condition called lactic acidosis.",
        "suggested_action": "Limit or avoid alcohol consumption while on Metformin.",
        "message": "Increased risk of lactic acidosis, a serious metabolic complication."
    },
    frozenset({"Metformin", "Contrast Dye"}): {
        "severity": "Warning",
        "severity_tier": "moderate",
        "why_it_matters": "Contrast dye stresses the kidneys, affecting how Metformin is cleared — combined they risk lactic acidosis.",
        "suggested_action": "Stop Metformin before the scan and wait 48 hours after to restart, as directed by your doctor.",
        "message": "Temporarily stop Metformin before and after contrast dye procedures to prevent lactic acidosis."
    },

    # --- Liver Toxicity ---
    frozenset({"Paracetamol", "Alcohol"}): {
        "severity": "Warning",
        "severity_tier": "moderate",
        "why_it_matters": "Both are processed by the liver — combined they significantly increase the chance of liver damage.",
        "suggested_action": "Do not drink alcohol while taking Paracetamol.",
        "message": "Increased risk of liver toxicity. Avoid alcohol when taking Paracetamol."
    },
    frozenset({"Methotrexate", "Ibuprofen"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Ibuprofen stops the body from clearing Methotrexate — combined they can lead to severe bone marrow toxicity.",
        "suggested_action": "Avoid NSAIDs. Talk to your doctor about safer pain relief options.",
        "message": "NSAIDs reduce Methotrexate clearance, risking severe toxicity including bone marrow suppression."
    },

    # --- Serotonin Syndrome ---
    frozenset({"Fluoxetine", "Tramadol"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both increase serotonin levels in the brain — combined they can trigger a dangerous condition called Serotonin Syndrome.",
        "suggested_action": "Consult your doctor immediately. Do not take together without strict medical supervision.",
        "message": "Risk of Serotonin Syndrome — a potentially fatal condition. Watch for agitation, confusion, rapid heart rate."
    },
    frozenset({"Sertraline", "Tramadol"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both raise serotonin levels — combined they can cause life-threatening Serotonin Syndrome.",
        "suggested_action": "Consult your doctor immediately for an alternative pain medication.",
        "message": "Risk of Serotonin Syndrome. This combination should be avoided."
    },

    # --- Kidney Risk ---
    frozenset({"Lisinopril", "Ibuprofen"}): {
        "severity": "Warning",
        "severity_tier": "moderate",
        "why_it_matters": "Ibuprofen reduces blood flow to the kidneys while Lisinopril alters kidney function — combined they can cause kidney damage.",
        "suggested_action": "Avoid regular use of Ibuprofen. Consult your doctor for safer pain relief.",
        "message": "NSAIDs can reduce the effectiveness of ACE inhibitors and increase kidney damage risk."
    },
    frozenset({"Lisinopril", "Potassium"}): {
        "severity": "Warning",
        "severity_tier": "moderate",
        "why_it_matters": "Lisinopril already makes the body hold onto potassium — adding supplements can push potassium to dangerously high levels.",
        "suggested_action": "Do not take potassium supplements unless explicitly prescribed by your doctor.",
        "message": "ACE inhibitors already increase potassium levels. Adding potassium supplements risks hyperkalemia."
    },

    # --- Antibiotic Interactions ---
    frozenset({"Ciprofloxacin", "Antacid"}): {
        "severity": "Warning",
        "severity_tier": "mild",
        "why_it_matters": "Antacids bind to the antibiotic in your stomach — combined they prevent the antibiotic from working.",
        "suggested_action": "Space doses 2 hours apart.",
        "message": "Antacids reduce Ciprofloxacin absorption by up to 90%. Take Ciprofloxacin 2 hours before antacids."
    },
    frozenset({"Doxycycline", "Antacid"}): {
        "severity": "Warning",
        "severity_tier": "mild",
        "why_it_matters": "Antacids and dairy block the antibiotic from entering your system — combined they make the antibiotic ineffective.",
        "suggested_action": "Take Doxycycline 1 hour before or 2 hours after antacids and dairy.",
        "message": "Antacids and dairy products significantly reduce Doxycycline absorption."
    },
    frozenset({"Azithromycin", "Antacid"}): {
        "severity": "Warning",
        "severity_tier": "mild",
        "why_it_matters": "Antacids reduce how much antibiotic your body absorbs — combined they can cause the infection treatment to fail.",
        "suggested_action": "Space doses at least 2 hours apart.",
        "message": "Take Azithromycin 1 hour before or 2 hours after antacids for proper absorption."
    },
    frozenset({"Metronidazole", "Alcohol"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Alcohol combined with Metronidazole causes a violent physical reaction including severe vomiting and flushed skin.",
        "suggested_action": "Do not drink alcohol while taking this antibiotic and for 3 days after stopping.",
        "message": "Causes severe nausea, vomiting, and flushing (disulfiram-like reaction). Absolutely avoid alcohol."
    },

    # --- Sedation Risk ---
    frozenset({"Diazepam", "Alcohol"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both heavily depress the nervous system — combined they can stop your breathing completely.",
        "suggested_action": "Never drink alcohol while taking Diazepam.",
        "message": "Combined CNS depression can cause fatal respiratory failure. Never mix benzodiazepines with alcohol."
    },
    frozenset({"Alprazolam", "Alcohol"}): {
        "severity": "Critical",
        "severity_tier": "severe",
        "why_it_matters": "Both slow down brain activity and breathing — combined they carry a very high risk of accidental death.",
        "suggested_action": "Never consume alcohol with Alprazolam.",
        "message": "Severe respiratory depression risk. This combination has caused many accidental deaths."
    },
    frozenset({"Cetirizine", "Diazepam"}): {
        "severity": "Warning",
        "severity_tier": "moderate",
        "why_it_matters": "Both cause significant drowsiness — combined they can severely impair your alertness and reaction times.",
        "suggested_action": "Do not drive or operate heavy machinery. Consider a non-drowsy allergy medicine.",
        "message": "Both cause drowsiness. Combined sedation may impair driving and daily activities."
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# CONTRAINDICATIONS (Drug vs Medical Condition)
# ──────────────────────────────────────────────────────────────────────────────
CONTRAINDICATIONS = {
    "Asthma": {
        "drugs": ["Ibuprofen", "Aspirin", "Propranolol", "Diclofenac", "Naproxen", "Atenolol", "Metoprolol"],
        "severity": "Warning",
        "message": "NSAIDs and Beta-blockers can trigger severe asthma attacks in sensitive individuals."
    },
    "Diabetes": {
        "drugs": ["Prednisolone", "Dexamethasone", "Prednisone", "Hydrocortisone"],
        "severity": "Warning",
        "message": "Steroids can significantly increase blood sugar levels, destabilizing diabetes control."
    },
    "Kidney disease": {
        "drugs": ["Ibuprofen", "Naproxen", "Diclofenac", "Celecoxib", "Gentamicin", "Lisinopril"],
        "severity": "Critical",
        "message": "NSAIDs and nephrotoxic drugs can further impair kidney function. Avoid or adjust dosage."
    },
    "Liver disease": {
        "drugs": ["Paracetamol", "Methotrexate", "Atorvastatin", "Simvastatin", "Valproate"],
        "severity": "Critical",
        "message": "These drugs are metabolized by the liver and can worsen hepatic damage."
    },
    "Pregnancy": {
        "drugs": ["Warfarin", "Lisinopril", "Atorvastatin", "Isotretinoin", "Methotrexate", "Valproate", "Misoprostol"],
        "severity": "Critical",
        "message": "Known to cause birth defects or pregnancy loss. Absolutely contraindicated during pregnancy."
    },
    "Heart failure": {
        "drugs": ["Ibuprofen", "Naproxen", "Diclofenac", "Verapamil", "Pioglitazone"],
        "severity": "Critical",
        "message": "These drugs can cause fluid retention and worsen heart failure."
    },
    "Hypertension": {
        "drugs": ["Ibuprofen", "Naproxen", "Pseudoephedrine", "Phenylephrine"],
        "severity": "Warning",
        "message": "These drugs can raise blood pressure or reduce the effectiveness of antihypertensive medications."
    },
    "Peptic ulcer": {
        "drugs": ["Aspirin", "Ibuprofen", "Naproxen", "Diclofenac", "Prednisolone"],
        "severity": "Critical",
        "message": "NSAIDs and steroids significantly increase the risk of GI bleeding in patients with peptic ulcer disease."
    },
    "Epilepsy": {
        "drugs": ["Tramadol", "Ciprofloxacin", "Bupropion"],
        "severity": "Warning",
        "message": "These drugs can lower the seizure threshold and trigger convulsions."
    },
    "Glaucoma": {
        "drugs": ["Atropine", "Ipratropium", "Amitriptyline"],
        "severity": "Warning",
        "message": "Anticholinergic drugs can increase intraocular pressure and worsen glaucoma."
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# DRUG CLASSES (for duplicate detection)
# Includes both generic names and Indian market brand names
# ──────────────────────────────────────────────────────────────────────────────
DRUG_CLASSES = {
    "NSAIDs": [
        "Ibuprofen", "Aspirin", "Naproxen", "Diclofenac", "Celecoxib",
        "Combiflam", "Brufen", "Voveran", "Meftal", "Mefenamic Acid"
    ],
    "Acetaminophen": [
        "Paracetamol", "Dolo", "Crocin", "Calpol", "Panadol", "Tylenol",
        "Metacin", "P-650", "Sumo", "Fepanil"
    ],
    "Statins": [
        "Atorvastatin", "Rosuvastatin", "Simvastatin", "Pravastatin",
        "Atorva", "Rozavel", "Ecosprin Av"
    ],
    "Antibiotics (Macrolides)": [
        "Azithromycin", "Erythromycin", "Clarithromycin",
        "Azee", "Zithromax"
    ],
    "Antibiotics (Fluoroquinolones)": [
        "Ciprofloxacin", "Levofloxacin", "Ofloxacin", "Norfloxacin",
        "Ciplox", "Levoflox", "Zenflox"
    ],
    "Antibiotics (Penicillins)": [
        "Amoxicillin", "Ampicillin", "Augmentin", "Mox", "Novamox"
    ],
    "Proton Pump Inhibitors": [
        "Omeprazole", "Pantoprazole", "Rabeprazole", "Esomeprazole",
        "Pan-D", "Pantop", "Razo"
    ],
    "Benzodiazepines": [
        "Diazepam", "Alprazolam", "Lorazepam", "Clonazepam",
        "Restyl", "Alprax", "Clonafit"
    ],
    "ACE Inhibitors": [
        "Lisinopril", "Enalapril", "Ramipril", "Perindopril"
    ],
    "Beta Blockers": [
        "Metoprolol", "Atenolol", "Propranolol", "Bisoprolol",
        "Betaloc", "Aten"
    ],
    "SSRIs": [
        "Fluoxetine", "Sertraline", "Escitalopram", "Paroxetine",
        "Nexito", "Cipralex"
    ],
    "Antihistamines": [
        "Cetirizine", "Levocetirizine", "Fexofenadine", "Loratadine",
        "Allegra", "Alerid", "Okacet"
    ],
    "Opioid Analgesics": [
        "Tramadol", "Codeine", "Morphine", "Fentanyl"
    ],
}

# ──────────────────────────────────────────────────────────────────────────────
# ALLERGY CROSS-REACTIVITY MAP
# Maps allergy names to drugs that should be avoided
# ──────────────────────────────────────────────────────────────────────────────
ALLERGY_MAP = {
    "Penicillin": {
        "drugs": ["Amoxicillin", "Ampicillin", "Augmentin", "Mox", "Novamox", "Piperacillin"],
        "severity": "Critical",
        "message": "Patient has Penicillin allergy. These drugs are in the penicillin family and can cause severe allergic reactions including anaphylaxis."
    },
    "Sulfa": {
        "drugs": ["Sulfamethoxazole", "Trimethoprim", "Bactrim", "Septran", "Dapsone", "Sulfasalazine"],
        "severity": "Critical",
        "message": "Patient has Sulfa drug allergy. These sulfonamide-based drugs can trigger severe allergic reactions."
    },
    "Aspirin": {
        "drugs": ["Aspirin", "Ibuprofen", "Naproxen", "Diclofenac", "Celecoxib", "Combiflam", "Brufen"],
        "severity": "Warning",
        "message": "Aspirin-sensitive patients may cross-react with other NSAIDs. Use Paracetamol as an alternative."
    },
    "Cephalosporin": {
        "drugs": ["Cephalexin", "Cefixime", "Ceftriaxone", "Cefpodoxime", "Taxim"],
        "severity": "Warning",
        "message": "Cephalosporin allergy detected. There is a 1-2% cross-reactivity risk with penicillins."
    },
    "Ibuprofen": {
        "drugs": ["Ibuprofen", "Brufen", "Combiflam"],
        "severity": "Critical",
        "message": "Patient is allergic to Ibuprofen. Avoid all ibuprofen-containing products."
    },
    "Paracetamol": {
        "drugs": ["Paracetamol", "Dolo", "Crocin", "Calpol", "Tylenol", "Metacin", "P-650", "Sumo"],
        "severity": "Critical",
        "message": "Patient is allergic to Paracetamol/Acetaminophen. Avoid all acetaminophen-containing products."
    },
    "Codeine": {
        "drugs": ["Codeine", "Tramadol", "Morphine"],
        "severity": "Warning",
        "message": "Codeine allergy detected. Cross-reactivity with other opioids is possible."
    },
    "Latex": {
        "drugs": [],
        "severity": "Info",
        "message": "Latex allergy noted. Ensure latex-free gloves and equipment during any procedures."
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# AGE-SPECIFIC WARNINGS
# ──────────────────────────────────────────────────────────────────────────────
AGE_WARNINGS = [
    {
        "min_age": 0,
        "max_age": 12,
        "drugs": ["Aspirin"],
        "severity": "Critical",
        "message": "Risk of Reye's Syndrome in children. Use Paracetamol or Ibuprofen instead."
    },
    {
        "min_age": 0,
        "max_age": 6,
        "drugs": ["Loperamide", "Codeine"],
        "severity": "Critical",
        "message": "Contraindicated in young children due to risk of severe respiratory depression."
    },
    {
        "min_age": 0,
        "max_age": 18,
        "drugs": ["Ciprofloxacin", "Levofloxacin", "Ofloxacin"],
        "severity": "Warning",
        "message": "Fluoroquinolones can affect cartilage development in growing children and adolescents."
    },
    {
        "min_age": 65,
        "max_age": 120,
        "drugs": ["Diazepam", "Amitriptyline", "Alprazolam", "Lorazepam", "Clonazepam"],
        "severity": "Warning",
        "message": "Increased risk of falls, confusion, and cognitive decline in elderly patients (Beers Criteria)."
    },
    {
        "min_age": 65,
        "max_age": 120,
        "drugs": ["Ibuprofen", "Naproxen", "Diclofenac"],
        "severity": "Warning",
        "message": "Elderly patients are at higher risk of GI bleeding and kidney injury from NSAIDs."
    },
]

# ──────────────────────────────────────────────────────────────────────────────
# DOSAGE LIMITS (max single dose in mg)
# Used for dosage red flag detection
# ──────────────────────────────────────────────────────────────────────────────
DOSAGE_LIMITS = {
    "Paracetamol": {"max_single": 1000, "max_daily": 4000, "unit": "mg"},
    "Ibuprofen": {"max_single": 800, "max_daily": 3200, "unit": "mg"},
    "Aspirin": {"max_single": 1000, "max_daily": 4000, "unit": "mg"},
    "Amoxicillin": {"max_single": 1000, "max_daily": 3000, "unit": "mg"},
    "Azithromycin": {"max_single": 500, "max_daily": 500, "unit": "mg"},
    "Metformin": {"max_single": 1000, "max_daily": 2550, "unit": "mg"},
    "Atorvastatin": {"max_single": 80, "max_daily": 80, "unit": "mg"},
    "Ciprofloxacin": {"max_single": 750, "max_daily": 1500, "unit": "mg"},
    "Omeprazole": {"max_single": 40, "max_daily": 40, "unit": "mg"},
    "Diclofenac": {"max_single": 50, "max_daily": 150, "unit": "mg"},
    "Dolo": {"max_single": 650, "max_daily": 4000, "unit": "mg"},
    "Crocin": {"max_single": 1000, "max_daily": 4000, "unit": "mg"},
}

# ──────────────────────────────────────────────────────────────────────────────
# BRAND-TO-GENERIC MAPPING
# Maps common Indian brand names to their generic equivalents for matching
# ──────────────────────────────────────────────────────────────────────────────
BRAND_TO_GENERIC = {
    "dolo": "Paracetamol",
    "dolo 650": "Paracetamol",
    "crocin": "Paracetamol",
    "calpol": "Paracetamol",
    "metacin": "Paracetamol",
    "sumo": "Paracetamol",
    "p-650": "Paracetamol",
    "fepanil": "Paracetamol",
    "combiflam": "Ibuprofen",
    "brufen": "Ibuprofen",
    "voveran": "Diclofenac",
    "meftal": "Mefenamic Acid",
    "augmentin": "Amoxicillin",
    "mox": "Amoxicillin",
    "novamox": "Amoxicillin",
    "azee": "Azithromycin",
    "ciplox": "Ciprofloxacin",
    "pan-d": "Pantoprazole",
    "pantop": "Pantoprazole",
    "razo": "Rabeprazole",
    "atorva": "Atorvastatin",
    "rozavel": "Rosuvastatin",
    "betaloc": "Metoprolol",
    "aten": "Atenolol",
    "nexito": "Escitalopram",
    "allegra": "Fexofenadine",
    "alerid": "Cetirizine",
    "okacet": "Cetirizine",
    "restyl": "Alprazolam",
    "alprax": "Alprazolam",
    "clonafit": "Clonazepam",
    "levoflox": "Levofloxacin",
    "zenflox": "Ofloxacin",
    "taxim": "Cefixime",
    "septran": "Sulfamethoxazole",
    "bactrim": "Sulfamethoxazole",
}

# ──────────────────────────────────────────────────────────────────────────────
# POLYPHARMACY / SEDATIVE LOAD DB
# ──────────────────────────────────────────────────────────────────────────────
SEDATIVE_DRUGS = {
    "Diazepam", "Alprazolam", "Clonazepam", "Lorazepam", "Zolpidem",
    "Tramadol", "Codeine", "Morphine", "Oxycodone", "Fentanyl",
    "Amitriptyline", "Diphenhydramine", "Chlorpheniramine", "Promethazine",
    "Gabapentin", "Pregabalin", "Quetiapine", "Olanzapine"
}

ANTICHOLINERGIC_DRUGS = {
    "Amitriptyline", "Diphenhydramine", "Oxybutynin", "Tolterodine",
    "Promethazine", "Chlorpheniramine", "Paroxetine"
}

# ──────────────────────────────────────────────────────────────────────────────
# GREEN PHARMACY / ENVIRONMENTAL IMPACT DB
# Format: "GenericName": {"impact": "High/Medium/Low", "reason": "...", "disposal": "..."}
# ──────────────────────────────────────────────────────────────────────────────
ENVIRONMENTAL_IMPACT = {
    "Salbutamol": {
        "impact": "High",
        "reason": "Metered-dose inhalers (MDIs) contain hydrofluoroalkane (HFA) propellants, which are potent greenhouse gases.",
        "disposal": "Return empty or expired inhalers to a pharmacy for specialized disposal. Do not puncture or throw in household trash."
    },
    "Budesonide": {
        "impact": "High",
        "reason": "MDI inhalers contain potent greenhouse gas propellants.",
        "disposal": "Return to pharmacy. Consider discussing Dry Powder Inhaler (DPI) alternatives with your provider."
    },
    "Diclofenac": {
        "impact": "High",
        "reason": "Highly toxic to avian scavengers and aquatic life. Trace amounts in water systems severely impact local ecosystems.",
        "disposal": "Never flush down the toilet. Use official drug take-back programs."
    },
    "Ibuprofen": {
        "impact": "Medium",
        "reason": "Found in high concentrations in wastewater; can affect aquatic plant and fish reproduction.",
        "disposal": "Do not flush. Dispose via pharmacy take-back."
    },
    "Fluoxetine": {
        "impact": "High",
        "reason": "Persistent in the environment. Acts as an endocrine disruptor in aquatic species, altering fish behavior and reproduction.",
        "disposal": "Do not flush under any circumstances. Return to pharmacy."
    },
    "Ethinylestradiol": {
        "impact": "Critical",
        "reason": "Potent endocrine disruptor. Extremely low concentrations in waterways cause feminization of male fish populations.",
        "disposal": "Never flush. Utilize specialized pharmaceutical disposal services."
    },
    "Amoxicillin": {
        "impact": "Medium",
        "reason": "Contributes to environmental antimicrobial resistance (AMR) if improperly disposed.",
        "disposal": "Complete the full course. Return any unused suspension or capsules to the pharmacy."
    },
    "Azithromycin": {
        "impact": "Medium",
        "reason": "Contributes to environmental antimicrobial resistance (AMR).",
        "disposal": "Complete the full course. Return unused medication to pharmacy."
    }
}

# ──────────────────────────────────────────────────────────────────────────────
# JAN AUSHADHI (GENERIC) & BRANDED INDICATIVE PRICES DB
# Format: Prices are in INR (₹). These are estimated indicative prices used to 
# demonstrate generic substitution savings.
# ──────────────────────────────────────────────────────────────────────────────
JAN_AUSHADHI_DB = {
    "Paracetamol": {"price": 10, "unit": "10 tablets"},
    "Ibuprofen": {"price": 18, "unit": "10 tablets"},
    "Amoxicillin": {"price": 35, "unit": "10 capsules"},
    "Azithromycin": {"price": 45, "unit": "3 tablets"},
    "Pantoprazole": {"price": 15, "unit": "10 tablets"},
    "Atorvastatin": {"price": 12, "unit": "10 tablets"},
    "Rosuvastatin": {"price": 20, "unit": "10 tablets"},
    "Diclofenac": {"price": 12, "unit": "10 tablets"},
    "Metoprolol": {"price": 15, "unit": "10 tablets"},
    "Ciprofloxacin": {"price": 30, "unit": "10 tablets"},
    "Levofloxacin": {"price": 40, "unit": "10 tablets"},
    "Rabeprazole": {"price": 18, "unit": "10 tablets"},
    "Metformin": {"price": 14, "unit": "10 tablets"},
    "Amlodipine": {"price": 10, "unit": "10 tablets"},
    "Enalapril": {"price": 12, "unit": "10 tablets"},
    "Lisinopril": {"price": 15, "unit": "10 tablets"},
    "Ramipril": {"price": 18, "unit": "10 tablets"},
    "Omeprazole": {"price": 12, "unit": "10 capsules"},
    "Cetirizine": {"price": 8, "unit": "10 tablets"},
    "Levocetirizine": {"price": 10, "unit": "10 tablets"},
    "Montelukast": {"price": 25, "unit": "10 tablets"},
    "Sertraline": {"price": 25, "unit": "10 tablets"},
    "Escitalopram": {"price": 20, "unit": "10 tablets"},
    "Alprazolam": {"price": 10, "unit": "10 tablets"},
    "Clonazepam": {"price": 12, "unit": "10 tablets"},
    "Doxycycline": {"price": 20, "unit": "10 capsules"},
    "Cefixime": {"price": 50, "unit": "10 tablets"},
    "Aceclofenac": {"price": 15, "unit": "10 tablets"},
    "Glimepiride": {"price": 15, "unit": "10 tablets"},
    "Losartan": {"price": 18, "unit": "10 tablets"},
    "Telmisartan": {"price": 20, "unit": "10 tablets"},
    "Folic Acid": {"price": 5, "unit": "10 tablets"},
    "Vitamin B12": {"price": 20, "unit": "10 tablets"},
    "Vitamin D3": {"price": 30, "unit": "10 tablets"},
    "Calcium Carbonate": {"price": 12, "unit": "10 tablets"},
    "Iron": {"price": 8, "unit": "10 tablets"},
    "Salbutamol": {"price": 25, "unit": "1 inhaler"},
    "Prednisolone": {"price": 10, "unit": "10 tablets"},
    "Aspirin": {"price": 5, "unit": "10 tablets"},
    "Warfarin": {"price": 20, "unit": "10 tablets"},
    "Clopidogrel": {"price": 25, "unit": "10 tablets"},
    "Tramadol": {"price": 18, "unit": "10 tablets"},
    "Amitriptyline": {"price": 10, "unit": "10 tablets"},
}

BRAND_PRICES_DB = {
    "dolo": 35,
    "dolo 650": 35,
    "crocin": 30,
    "combiflam": 45,
    "augmentin": 200,
    "mox": 120,
    "azee": 130,
    "pan-d": 150,
    "pantop": 140,
    "razo": 180,
    "atorva": 110,
    "rozavel": 160,
    "voveran": 90,
    "betaloc": 80,
    "ciplox": 85,
    "taxim": 120,
    "glucophage": 95,
    "glycomet": 80,
    "amlokind": 70,
    "amlong": 75,
    "cardace": 100,
    "clopilet": 140,
    "ecosprin": 30,
    "lariago": 60,
    "allegra": 90,
    "montair": 95,
    "foracort": 350,
    "asthalin": 90,
    "serenata": 90,
    "nexito": 130,
    "restyl": 55,
    "alprax": 55,
    "clonafit": 70,
    "xykaa": 45,
    "zerodol": 70,
    "hifenac": 65,
    "telmikind": 95,
    "telsartan": 100,
}

