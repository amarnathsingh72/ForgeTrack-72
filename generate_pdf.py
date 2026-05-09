from fpdf import FPDF
import os

pdf = FPDF()
pdf.add_page()
pdf.set_font("Arial", size=11)

with open("sample_soc2_policy.md", "r", encoding="utf-8") as f:
    text = f.read()

# Replace basic markdown for cleaner PDF output
text = text.replace("**", "")
text = text.replace("# ", "")
text = text.replace("## ", "")
text = text.replace("*   ", "- ")

# Multi-cell allows text wrapping
for line in text.split('\n'):
    if line.strip() == "":
        pdf.ln(5)
    else:
        pdf.multi_cell(0, 6, line)

pdf.output("sample_soc2_policy.pdf")
print("PDF Generated Successfully")
