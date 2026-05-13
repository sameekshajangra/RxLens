import json
import Levenshtein

def format_to_json(data):
    """Formats the extracted medical data into a structured JSON string."""
    return json.dumps(data, indent=4)

def generate_human_readable_summary(data):
    """Generates a professional, clinical-sounding summary from the structured data."""
    drug_str = data.get("drug", "")
    drugs_list = data.get("drugs_list", [])
    dosage = data.get("dosage", "as directed")
    frequency = data.get("frequency", "as required")
    duration = data.get("duration", "specified period")
    
    # Handle multiple drugs
    main_drugs = drug_str if drug_str else (", ".join(drugs_list) if drugs_list else "N/A")
    
    if main_drugs == "N/A" or not main_drugs:
        return "The prescription details could not be clearly identified. Please ensure the image is clear and contains a valid prescription."
        
    summary = f"This prescription contains {main_drugs}. "
    summary += f"The typical dosage is {dosage}, to be taken {frequency.lower()} "
    summary += f"for a total duration of {duration}. "
    
    if data.get("instructions"):
        summary += f"Special instructions: {data.get('instructions')}. "
        
    schedule = data.get("schedule", [])
    if schedule:
        summary += "Here is your treatment schedule. "
        for item in schedule:
            summary += f"At {item.get('time')}, {item.get('task')}. "
            
    return summary

def calculate_cer(pred, true):
    """Calculates the Character Error Rate (CER)."""
    pred = pred.replace(" ", "")
    true = true.replace(" ", "")
    if len(true) == 0:
        return 0.0 if len(pred) == 0 else 1.0
    distance = Levenshtein.distance(pred, true)
    return distance / len(true)

def calculate_wer(pred, true):
    """Calculates the Word Error Rate (WER)."""
    pred_words = pred.split()
    true_words = true.split()
    if len(true_words) == 0:
        return 0.0 if len(pred_words) == 0 else 1.0
    distance = Levenshtein.distance(pred_words, true_words)
    return distance / len(true_words)
