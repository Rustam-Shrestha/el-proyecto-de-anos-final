const fs = require("fs");
(async () => {
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  const parsePdf = mod.default ?? mod;
  const buffer = fs.readFileSync("test-statement.pdf");
  try {
    const result = await parsePdf(buffer);
    console.log("OK len:", result.text.trim().length);
  } catch (e) {
    console.log("STACK:", e.stack.split("\n").slice(0, 12).join("\n"));
  }
})();
