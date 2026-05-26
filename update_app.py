import re

with open("frontend/src/App.jsx", "r") as f:
    content = f.read()

# Add import i18n
if "import i18n from './i18n';" not in content:
    content = content.replace("import './index.css';", "import './index.css';\nimport i18n from './i18n';")

# Remove the translations object and replace `const t = translations[language];` with `const t = i18n[language];`
# The translations object starts around line 168 and ends around 304.
# We can find it by regex:
pattern = re.compile(r"const translations = \{.*?\n  \};\n\n  const t = translations\[language\];", re.DOTALL)
if pattern.search(content):
    content = pattern.sub("const t = i18n[language];", content)
else:
    print("Could not find translations object block!")

# Since the new i18n.js has slightly different keys, let's just make sure some key mappings exist.
# Or better, we can map the old keys in i18n.js or update App.jsx to use new keys.
# Let's write the new content back.
with open("frontend/src/App.jsx", "w") as f:
    f.write(content)

print("App.jsx updated.")
