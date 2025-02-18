// src/utils/setup.js
import fs from "fs";
import path from "path";

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Add .gitignore for logs directory if it doesn't exist
const gitignorePath = path.join(process.cwd(), ".gitignore");
let gitignoreContent = fs.existsSync(gitignorePath)
  ? fs.readFileSync(gitignorePath, "utf8")
  : "";

if (!gitignoreContent.includes("logs/")) {
  gitignoreContent += "\n# Logs\nlogs/\n";
  fs.writeFileSync(gitignorePath, gitignoreContent);
}
