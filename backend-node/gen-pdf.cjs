const fs = require("fs");
const lines = [
  "FINGUARD BANK - ACCOUNT STATEMENT",
  "Account Holder: Demo Customer",
  "Period: 2026-09-01 to 2026-09-30",
  "Monthly Salary Credit 85000",
  "Grocery Store Debit 12500",
  "House Rent Debit 20000",
  "Electricity Bill Debit 3500",
  "Closing Balance 59000",
];
let y = 750;
let content = "BT /F1 12 Tf ";
for (const ln of lines) {
  const esc = ln.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  content += `50 ${y} Td (${esc}) Tj `;
  y -= 20;
}
content += "ET";
const objs = [];
objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
objs[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
objs[3] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>";
objs[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
objs[4] = `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
let pdf = "%PDF-1.4\n";
const offsets = {};
for (let i = 1; i <= 5; i++) {
  offsets[i] = Buffer.byteLength(pdf);
  pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`;
}
const xrefPos = Buffer.byteLength(pdf);
pdf += `xref\n0 6\n0000000000 65535 f \n`;
for (let i = 1; i <= 5; i++) pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
fs.writeFileSync("test-statement.pdf", pdf);
console.log("wrote test-statement.pdf", Buffer.byteLength(pdf), "bytes");
