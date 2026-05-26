import re

with open("api/index.py", "r") as f:
    content = f.read()

# Add a strong explicit instruction for translation
old_instruction = "3. ALL text values MUST be translated accurately into {lang}. Do not leave English text unless it's an untranslatable drug name."
new_instruction = "3. CRITICAL: ALL text values MUST be translated accurately into {lang}. Do not leave any English text in the values (unless it is a globally standard medical drug name). If lang is Hindi, the schedule tasks, notes, instructions, and side effects MUST all be strictly in Hindi."

if old_instruction in content:
    content = content.replace(old_instruction, new_instruction)
    with open("api/index.py", "w") as f:
        f.write(content)
    print("Updated prompt instructions successfully.")
else:
    print("Could not find the instruction line.")
