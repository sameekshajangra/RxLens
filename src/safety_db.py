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
        "message": "High risk of internal bleeding. These medications should not be taken together without strict medical supervision."
    },
    frozenset({"Aspirin", "Ibuprofen"}): {
        "severity": "Warning",
        "message": "Increased risk of stomach ulcers and bleeding. Ibuprofen may also interfere with Aspirin's heart-protective benefits."
    },
    frozenset({"Aspirin", "Clopidogrel"}): {
        "severity": "Warning",
        "message": "Dual antiplatelet therapy increases bleeding risk. Monitor for signs of bruising or bleeding."
    },
    frozenset({"Warfarin", "Ibuprofen"}): {
        "severity": "Critical",
        "message": "NSAIDs dramatically increase bleeding risk when combined with Warfarin. Avoid this combination."
    },
    frozenset({"Warfarin", "Naproxen"}): {
        "severity": "Critical",
        "message": "Naproxen + Warfarin significantly increases the risk of GI bleeding."
    },

    # --- Cardiac Risk ---
    frozenset({"Sildenafil", "Nitroglycerin"}): {
        "severity": "Critical",
        "message": "Dangerous drop in blood pressure. This combination can be fatal."
    },
    frozenset({"Azithromycin", "Amiodarone"}): {
        "severity": "Critical",
        "message": "Risk of serious heart rhythm disturbances (QT prolongation). Can cause fatal arrhythmia."
    },
    frozenset({"Ciprofloxacin", "Amiodarone"}): {
        "severity": "Critical",
        "message": "Both drugs prolong the QT interval. Combined use risks life-threatening cardiac arrhythmia."
    },
    frozenset({"Metoprolol", "Verapamil"}): {
        "severity": "Critical",
        "message": "Both drugs slow heart rate. Combined use can cause severe bradycardia or heart block."
    },
    frozenset({"Atenolol", "Verapamil"}): {
        "severity": "Critical",
        "message": "Combined beta-blocker and calcium channel blocker can cause dangerous bradycardia."
    },
    frozenset({"Digoxin", "Amiodarone"}): {
        "severity": "Critical",
        "message": "Amiodarone increases Digoxin levels, risking toxicity. Digoxin dose must be reduced."
    },

    # --- Metabolic Risk ---
    frozenset({"Metformin", "Alcohol"}): {
        "severity": "Warning",
        "message": "Increased risk of lactic acidosis, a serious metabolic complication."
    },
    frozenset({"Metformin", "Contrast Dye"}): {
        "severity": "Warning",
        "message": "Temporarily stop Metformin before and after contrast dye procedures to prevent lactic acidosis."
    },

    # --- Liver Toxicity ---
    frozenset({"Paracetamol", "Alcohol"}): {
        "severity": "Warning",
        "message": "Increased risk of liver toxicity. Avoid alcohol when taking Paracetamol."
    },
    frozenset({"Methotrexate", "Ibuprofen"}): {
        "severity": "Critical",
        "message": "NSAIDs reduce Methotrexate clearance, risking severe toxicity including bone marrow suppression."
    },

    # --- Serotonin Syndrome ---
    frozenset({"Fluoxetine", "Tramadol"}): {
        "severity": "Critical",
        "message": "Risk of Serotonin Syndrome — a potentially fatal condition. Watch for agitation, confusion, rapid heart rate."
    },
    frozenset({"Sertraline", "Tramadol"}): {
        "severity": "Critical",
        "message": "Risk of Serotonin Syndrome. This combination should be avoided."
    },

    # --- Kidney Risk ---
    frozenset({"Lisinopril", "Ibuprofen"}): {
        "severity": "Warning",
        "message": "NSAIDs can reduce the effectiveness of ACE inhibitors and increase kidney damage risk."
    },
    frozenset({"Lisinopril", "Potassium"}): {
        "severity": "Warning",
        "message": "ACE inhibitors already increase potassium levels. Adding potassium supplements risks hyperkalemia."
    },

    # --- Antibiotic Interactions ---
    frozenset({"Ciprofloxacin", "Antacid"}): {
        "severity": "Warning",
        "message": "Antacids reduce Ciprofloxacin absorption by up to 90%. Take Ciprofloxacin 2 hours before antacids."
    },
    frozenset({"Doxycycline", "Antacid"}): {
        "severity": "Warning",
        "message": "Antacids and dairy products significantly reduce Doxycycline absorption."
    },
    frozenset({"Azithromycin", "Antacid"}): {
        "severity": "Warning",
        "message": "Take Azithromycin 1 hour before or 2 hours after antacids for proper absorption."
    },
    frozenset({"Metronidazole", "Alcohol"}): {
        "severity": "Critical",
        "message": "Causes severe nausea, vomiting, and flushing (disulfiram-like reaction). Absolutely avoid alcohol."
    },

    # --- Sedation Risk ---
    frozenset({"Diazepam", "Alcohol"}): {
        "severity": "Critical",
        "message": "Combined CNS depression can cause fatal respiratory failure. Never mix benzodiazepines with alcohol."
    },
    frozenset({"Alprazolam", "Alcohol"}): {
        "severity": "Critical",
        "message": "Severe respiratory depression risk. This combination has caused many accidental deaths."
    },
    frozenset({"Cetirizine", "Diazepam"}): {
        "severity": "Warning",
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
