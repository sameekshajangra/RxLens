import re

with open("api/index.py", "r") as f:
    content = f.read()

replacement = """def _make_summary(data: dict, lang: str = "English") -> str:
    drug = data.get("drug", "Unknown medication" if lang == "English" else "अज्ञात दवा" if lang == "Hindi" else "Medicamento desconocido")
    dosage = data.get("dosage", "")
    freq = data.get("frequency", "")
    instructions = data.get("instructions", "")
    
    parts = []
    
    if lang.lower() == "hindi":
        parts.append(f"दवा: {drug}")
        if dosage: parts.append(f"खुराक: {dosage}")
        if freq: parts.append(f"समय: {freq}")
        if instructions: parts.append(f"निर्देश: {instructions}")
    elif lang.lower() == "spanish":
        parts.append(f"Medicamento: {drug}")
        if dosage: parts.append(f"Dosis: {dosage}")
        if freq: parts.append(f"Frecuencia: {freq}")
        if instructions: parts.append(f"Instrucciones: {instructions}")
    else:
        parts.append(f"Medication: {drug}")
        if dosage: parts.append(f"Dosage: {dosage}")
        if freq: parts.append(f"Frequency: {freq}")
        if instructions: parts.append(f"Instructions: {instructions}")
        
    return ". ".join(parts) + "."
"""

pattern = re.compile(r'def _make_summary\(data: dict, lang: str = "English"\) -> str:.*?return "\. "\.join\(parts\) \+ "\."', re.DOTALL)

if pattern.search(content):
    content = pattern.sub(replacement.strip(), content)
    with open("api/index.py", "w") as f:
        f.write(content)
    print("Updated _make_summary successfully.")
else:
    print("Could not find _make_summary")
