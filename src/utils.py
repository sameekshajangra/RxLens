import json
import Levenshtein

def format_to_json(data):
    """Formats the extracted medical data into a structured JSON string."""
    return json.dumps(data, indent=4)

def generate_human_readable_summary(data):
    """Generates a professional, clinical-sounding summary from the structured data."""
    drug = data.get("drug", "N/A")
    dosage = data.get("dosage", "as directed")
    frequency = data.get("frequency", "as required")
    duration = data.get("duration", "specified period")
    
    if drug == "N/A" or not drug:
        return "The prescription details could not be clearly identified."
        
    summary = f"Patient is prescribed {drug.title()}. "
    summary += f"The dosage is {dosage}, to be taken {frequency.lower()} "
    summary += f"for a total duration of {duration}."
    
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
