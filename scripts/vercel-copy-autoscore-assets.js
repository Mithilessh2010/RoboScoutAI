const fs = require("fs");
const path = require("path");

const outputFunctionsDir = path.join(".vercel", "output", "functions");
const scriptSource = path.join("scripts", "decode", "predict_video_decode.py");

if (!fs.existsSync(outputFunctionsDir)) {
    console.warn(`No Vercel functions directory found at ${outputFunctionsDir}`);
    process.exit(0);
}

for (const entry of fs.readdirSync(outputFunctionsDir)) {
    if (!entry.endsWith(".func")) continue;

    const functionDir = path.join(outputFunctionsDir, entry);
    const scriptDest = path.join(functionDir, scriptSource);

    fs.mkdirSync(path.dirname(scriptDest), { recursive: true });
    fs.copyFileSync(scriptSource, scriptDest);
}

console.log("Copied DECODE autoscore prediction script into Vercel functions.");
