from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.pyplot as plt
lines = [
  "FINGUARD BANK - ACCOUNT STATEMENT",
  "Account Holder: Demo Customer",
  "Period: 2026-09-01 to 2026-09-30",
  "Monthly Salary Credit 85000",
  "Grocery Store Debit 12500",
  "House Rent Debit 20000",
  "Electricity Bill Debit 3500",
  "Closing Balance 59000",
]
fig = plt.figure(figsize=(8.5, 11))
fig.text(0.1, 0.9, "\n".join(lines), fontsize=12, family="monospace", va="top", ha="left")
with PdfPages("test-statement.pdf") as pdf:
    pdf.savefig(fig)
print("wrote test-statement.pdf")
