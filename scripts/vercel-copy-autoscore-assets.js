const fs = require("fs");
const path = require("path");

const outputFunctionsDir = path.join(".vercel", "output", "functions");
const modelSource = path.join("services", "video-processing", "models", "decode", "best.pt");
const scriptSource = path.join("scripts", "decode", "predict_video_decode.py");

if (!fs.existsSync(outputFunctionsDir)) {
    console.warn(`No Vercel functions directory found at ${outputFunctionsDir}`);
    process.exit(0);
}

for (const entry of fs.readdirSync(outputFunctionsDir)) {
    if (!entry.endsWith(".func")) continue;

    const functionDir = path.join(outputFunctionsDir, entry);
    const modelDest = path.join(functionDir, modelSource);
    const scriptDest = path.join(functionDir, scriptSource);

    fs.mkdirSync(path.dirname(modelDest), { recursive: true });
    fs.mkdirSync(path.dirname(scriptDest), { recursive: true });
    fs.copyFileSync(modelSource, modelDest);
    fs.copyFileSync(scriptSource, scriptDest);
}

console.log("Copied DECODE autoscore model and prediction script into Vercel functions.");
