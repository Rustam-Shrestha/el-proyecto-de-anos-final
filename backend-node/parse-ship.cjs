const fs = require("fs");
(async () => {
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const parsePdf = mod.default ?? mod;
  const buffer = fs.readFileSync("node_modules/pdf-parse/test/data/05-versions-space.pdf");
  console.log("buf bytes:", buffer.length, "isBuffer:", Buffer.isBuffer(buffer));
  const result = await parsePdf(buffer);
  console.log("OK len:", result.text.trim().length, "pages:", result.numpages);
})().catch((e) => { console.log("FAILED:", e.message); process.exit(1); });
