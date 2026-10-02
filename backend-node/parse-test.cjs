const fs = require("fs");
(async () => {
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const parsePdf = mod.default ?? mod;
  const buffer = fs.readFileSync("test-statement.pdf");
  const result = await parsePdf(buffer);
  console.log("TEXT LEN:", result.text ? result.text.trim().length : 0);
  console.log("PAGES:", result.numpages);
  console.log("--- text ---");
  console.log(result.text.trim());
})().catch((e) => { console.log("PARSE FAILED:", e.message); process.exit(1); });
