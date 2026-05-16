import fs from "fs";
import path from "path";

const root = process.cwd();
const required = [
  "site/index.html",
  "site/verify.html",
  "site/hardware.html",
  "site/mobile.html",
  "site/about.html",
  "site/contact.html",
  "site/mentions-legales.html",
  "site/style.css",
  "site/config.js",
  "site/verify.js",
];

let failed = false;
for (const rel of required) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    console.error("Fichier manquant :", rel);
    failed = true;
  }
}

const htmlFiles = required.filter((f) => f.endsWith(".html"));
for (const rel of htmlFiles) {
  const html = fs.readFileSync(path.join(root, rel), "utf8");
  if (!/<!DOCTYPE html>/i.test(html)) {
    console.error("DOCTYPE manquant :", rel);
    failed = true;
  }
  if (html.includes("</motion>") || html.includes("<motion ")) {
    console.error("Balise invalide <motion> :", rel);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("check-site OK —", required.length, "fichiers");
