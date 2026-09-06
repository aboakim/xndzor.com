const fs = require("fs");
const path = require("path");
const data = require("./xndzor-i18n-data");

function deepMerge(target, source) {
  for (const [k, v] of Object.entries(source)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      target[k] &&
      typeof target[k] === "object" &&
      !Array.isArray(target[k])
    ) {
      deepMerge(target[k], v);
    } else {
      target[k] = v;
    }
  }
}

for (const locale of ["en", "hy", "ru"]) {
  const file = path.join(__dirname, "..", "messages", `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(file, "utf8"));
  deepMerge(messages, data[locale]);
  fs.writeFileSync(file, JSON.stringify(messages, null, 2) + "\n");
  console.log("merged xndzor", locale);
}
