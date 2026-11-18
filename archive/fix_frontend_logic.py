import re

with open("frontend/src/App.jsx", "r") as f:
    content = f.read()

# 1. Update the Audio URL handling
content = content.replace(
    "if (safeResult.audio_url) {\n        setAudioUrl(`/api/audio/${safeResult.audio_url}`);\n      }",
    "if (safeResult.audio_base64) {\n        setAudioUrl(`data:audio/mpeg;base64,${safeResult.audio_base64}`);\n      }"
)

# We have conditions for SIMPLE, STANDARD, DETAILED, WORKER
# Let's wrap blocks inside App.jsx

# A. Accessibility Panel
# Hide in SIMPLE and STANDARD. Show only in DETAILED.
accessibility_regex = re.compile(r'(\{result\.data\.accessibility_analysis && \(\s*<div className="glass-card accessibility-card".*?</div>\s*\)\})', re.DOTALL)
if accessibility_regex.search(content):
    content = accessibility_regex.sub(r"{userMode === 'patient' && explanationLevel === 'detailed' && \1}", content)

# B. AI Hallucination Safeguard
# Show in DETAILED or WORKER, hide in SIMPLE and STANDARD
hallucination_regex = re.compile(r'(<!-- AI Hallucination Safeguard Banner -->.*?<div className="glass-card" style=\{\{ background: \'var\(--warning-light\)\'.*?</div>)', re.DOTALL)
# wait, it's a JSX comment, it might not be matched exactly. Let's find it.
hallucination_regex2 = re.compile(r'(\{\/\* AI Hallucination Safeguard Banner \*\/\}\s*<div className="glass-card" style=\{\{ background: \'var\(--warning-light\)\'.*?</div>)', re.DOTALL)
if hallucination_regex2.search(content):
    content = hallucination_regex2.sub(r"{userMode !== 'patient' || explanationLevel === 'detailed' ? (\1) : null}", content)

# C. Polypharmacy Review (Provider Notes)
poly_regex = re.compile(r'(\{safeArray\(result\.data\.polypharmacy_notes\)\.length > 0 && \(\s*<div className="glass-card polypharmacy-card".*?</div>\s*\)\})', re.DOTALL)
if poly_regex.search(content):
    content = poly_regex.sub(r"{(userMode === 'worker' || explanationLevel === 'detailed') && \1}", content)

# D. AI Confidence Score & Explanation Panel
confidence_panel_regex = re.compile(r'(\{\/\* AI Confidence & Explainability \*\/\}\s*<div className="grid-2">.*?</div>\s*</div>)', re.DOTALL)
if confidence_panel_regex.search(content):
    content = confidence_panel_regex.sub(r"{(userMode === 'worker' || explanationLevel !== 'simple') && \1}", content)
    
# E. Structured Medication Table
table_regex = re.compile(r'(\{\/\* Structured Medication Table \*\/\}\s*<div className="glass-card">.*?</table>\s*</div>\s*</div>)', re.DOTALL)
if table_regex.search(content):
    content = table_regex.sub(r"{(userMode === 'worker' || explanationLevel !== 'simple') && \1}", content)

# F. Pharmacist Consultation Recommended
pharmacist_regex = re.compile(r'(\{result\.data\.is_uncertain && \(\s*<div className="glass-card" style=\{\{ background: \'#fef2f2\'.*?</div>\s*\)\})', re.DOTALL)
if pharmacist_regex.search(content):
    content = pharmacist_regex.sub(r"{(userMode === 'worker' || explanationLevel === 'detailed') && \1}", content)

# G. Clinical Terms Simplified (Confusing Terms)
terms_regex = re.compile(r'(\{safeArray\(result\.data\.confusing_terms\)\.length > 0 && \(\s*<div className="glass-card">.*?</div>\s*\)\})', re.DOTALL)
if terms_regex.search(content):
    content = terms_regex.sub(r"{(userMode === 'patient' && explanationLevel === 'detailed') && \1}", content)

# For SIMPLE mode text enlargement, we can add a class to the summary paragraph based on explanation level
content = content.replace(
    '<p style={{lineHeight: \'1.6\', color: \'var(--text-muted)\'}}>{result.summary}</p>',
    '<p style={{lineHeight: \'1.6\', color: \'var(--text-muted)\', fontSize: explanationLevel === \'simple\' ? \'1.25rem\' : \'1rem\', fontWeight: explanationLevel === \'simple\' ? 500 : 400}}>{result.summary}</p>'
)

with open("frontend/src/App.jsx", "w") as f:
    f.write(content)

print("Applied strict role-based views in frontend.")
