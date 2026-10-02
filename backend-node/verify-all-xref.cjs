const fs = require("fs");
const buf = fs.readFileSync("test-statement.pdf");
const s = buf.toString("latin1");
const xi = 15656;
const entries = s.slice(xi).split("\n").slice(2);
let bad = 0, checked = 0;
for (let i = 0; i < 64; i++) {
  const m = entries[i].match(/^(\d{10}) (\d{5}) ([fn]) /);
  if (!m) { console.log(`entry ${i}: UNPARSEABLE ${JSON.stringify(entries[i])}`); bad++; continue; }
  if (m[3] === "f") continue;
  const off = parseInt(m[1]);
  const head = s.slice(off, off + 20).split("\n")[0];
  checked++;
  const ok = new RegExp(`^${i} \\d+ obj`).test(head);
  if (!ok) { console.log(`entry ${i}: offset ${off} -> ${JSON.stringify(head)}`); bad++; }
}
console.log(`checked=${checked} bad=${bad}`);
