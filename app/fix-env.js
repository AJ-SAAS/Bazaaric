const fs = require("fs");
const path = require("path");

const keyFilePath = process.argv[2];
if (!keyFilePath) {
  console.error("Usage: node fix-env.js /path/to/downloaded-key.json");
  process.exit(1);
}

const raw = fs.readFileSync(keyFilePath, "utf8");
const obj = JSON.parse(raw); // fails loudly here if the download itself is bad
const minified = JSON.stringify(obj); // guaranteed single line, correctly escaped

const envPath = path.join(process.cwd(), ".env.local");
let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

envContent = envContent
  .split("\n")
  .filter((line) => !line.startsWith("FIREBASE_SERVICE_ACCOUNT_KEY="))
  .join("\n");

envContent = envContent.trimEnd() + `\nFIREBASE_SERVICE_ACCOUNT_KEY='${minified}'\n`;

fs.writeFileSync(envPath, envContent);
console.log("FIREBASE_SERVICE_ACCOUNT_KEY written to .env.local successfully.");