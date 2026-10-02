const fs = require("fs");
const buf = fs.readFileSync("test-statement.pdf");
const s = buf.toString("latin1");
for (let i = 1; i <= 5; i++) {
  const m = s.match(new RegExp(`startxref\\s+(\\d+)`));
}
const xpos = parseInt(s.match(/startxref\s+(\d+)/)[1]);
console.log("file len:", buf.length, "startxref claims:", xpos);
console.log("bytes at claim:", JSON.stringify(s.slice(xpos, xpos + 10)));
const xrefSec = s.slice(xpos);
const lines = xrefSec.split("\n");
console.log("xref header lines:", JSON.stringify(lines.slice(0, 3)));
