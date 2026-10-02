const fs = require("fs");
for (const f of ["test-statement.pdf", "node_modules/pdf-parse/test/data/05-versions-space.pdf"]) {
  const head = fs.readFileSync(f).slice(0, 400).toString("latin1");
  const full = fs.readFileSync(f).toString("latin1");
  console.log("===", f);
  console.log("header:", JSON.stringify(head.slice(0, 30)));
  console.log("has objstm:", full.includes("ObjStm"), "| has /XRef:", full.includes("/XRef"), "| xref count:", (full.match(/^xref$/gm) || []).length, "| startxref:", (full.match(/startxref/g) || []).length);
}
