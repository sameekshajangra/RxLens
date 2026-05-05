import json
import requests
from fuzzywuzzy import process
import os

# Load mock database as fallback
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'mock_drug_db.json')

def load_db():
    with open(DB_PATH, 'r') as f:
        return json.load(f)

DRUG_DB = load_db()

def get_rxcui(drug_name):
    """Fetches the RxCUI (Concept ID) for a drug name from NIH RxNav."""
    try:
        url = f"https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term={drug_name}&maxEntries=1"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        candidates = data.get("approximateGroup", {}).get("candidate", [])
        if candidates:
            return candidates[0].get("rxcui")
        return None
    except Exception as e:
        print(f"RxNav API Error (CUI Fetch): {e}")
        return None

def check_drug_interactions(drug_list):
    """Checks for interactions between a list of drugs using the NIH RxNav API."""
    if len(drug_list) < 2:
        return []
        
    rxcuis = []
    for drug in drug_list:
        cui = get_rxcui(drug)
        if cui:
            rxcuis.append(cui)
            
    if len(rxcuis) < 2:
        return []
        
    try:
        cui_str = "+".join(rxcuis)
        url = f"https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis={cui_str}"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        interactions = []
        full_interaction_groups = data.get("fullInteractionTypeGroup", [])
        for group in full_interaction_groups:
            for interaction_type in group.get("fullInteractionType", []):
                for pair in interaction_type.get("interactionPair", []):
                    description = pair.get("description")
                    if description:
                        interactions.append(description)
        
        return list(set(interactions)) # Deduplicate
    except Exception as e:
        print(f"RxNav API Error (Interaction Check): {e}")
        return []

def validate_drug_name(name):
    """Validates the drug name against mock DB or simple existence check."""
    normalized_name = name.lower().strip()
    if normalized_name in DRUG_DB:
        return True, "Verified in database."
    return False, "Unknown drug name."

def suggest_corrections(name):
    """Suggests corrected drug names using fuzzy matching."""
    suggestions = process.extract(name, list(DRUG_DB.keys()), limit=3)
    return [s[0] for s in suggestions if s[1] > 70]

def check_dosage_safety(drug_name, extracted_dosage):
    """Checks if the extracted dosage exceeds safety limits in the mock DB."""
    drug_info = DRUG_DB.get(drug_name.lower())
    if not drug_info:
        return None, "No safety data available."
        
    max_dose = drug_info.get("max_daily_dose_mg")
    if not max_dose:
        return None, "Max dosage not specified."
        
    # Simple logic to extract numbers from dosage string (e.g., "500mg" -> 500)
    import re
    nums = re.findall(r'\d+', extracted_dosage)
    if nums:
        dose_val = int(nums[0])
        if dose_val > max_dose:
            return False, f"Potential overdose: {extracted_dosage} exceeds safety limit of {max_dose}mg."
        return True, "Dosage is within safe limits."
        
    return None, "Could not parse dosage for safety check."
