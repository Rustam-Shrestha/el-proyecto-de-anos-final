const fs = require("fs");
const s = fs.readFileSync("test-statement.pdf").toString("latin1");
console.log(JSON.stringify(s.slice(15656, 15656 + 500)));
