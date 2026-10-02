const fs = require("fs");
const buf = fs.readFileSync("test-statement.pdf");
const s = buf.toString("latin1");
for (let i = 1; i <= 5; i++) {
  console.log(`obj ${i}: actual=`, s.indexOf(`${i} 0 obj`));
}
const m = s.slice(s.indexOf("xref")).split("\n").slice(2, 8);
m.forEach((l, k) => console.log(`entry ${k}: len=${l.length} text=${JSON.stringify(l)}`));
