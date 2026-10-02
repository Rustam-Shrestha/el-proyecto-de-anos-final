const fs = require("fs");
const s = fs.readFileSync("test-statement.pdf").toString("latin1");
const xi = s.lastIndexOf("xref");
console.log("file len:", s.length, "xref at:", xi);
console.log(JSON.stringify(s.slice(xi, xi + 400)));
console.log("tail:", JSON.stringify(s.slice(-120)));
