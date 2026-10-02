const fs = require("fs");
const buf = fs.readFileSync("test-statement.pdf");
console.log("at 16:", JSON.stringify(buf.slice(16, 40).toString("latin1")));
console.log("idx '1 0 obj':", buf.toString("latin1").indexOf("1 0 obj"));
console.log("first 30 bytes hex:", buf.slice(0, 30).toString("hex"));
