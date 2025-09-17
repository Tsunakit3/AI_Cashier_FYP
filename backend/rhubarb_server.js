const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");

const app = express();

// Enable CORS for React frontend
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Save uploads as .wav
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + ".wav");
    },
});
const upload = multer({ storage });

app.post("/rhubarb", upload.single("audio"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No audio uploaded" });
    }

    const inputPath = req.file.path;
    const outputPath = inputPath + ".json";

    const rhubarbPath = path.join(__dirname, "..", "rhubarb", "Rhubarb-Lip-Sync-1.13.0-Windows", "rhubarb.exe");
    const rhubarbCmd = `"${rhubarbPath}" -f json -o "${outputPath}" "${inputPath}"`;

    console.log("👉 Rhubarb path:", rhubarbPath);
    console.log("👉 Running:", rhubarbCmd);

    exec(rhubarbCmd, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Rhubarb error:", stderr);
            return res.status(500).json({ error: "Rhubarb failed" });
        }

        fs.readFile(outputPath, "utf8", (err, data) => {
            if (err) {
                return res.status(500).json({ error: "Failed to read Rhubarb output" });
            }

            try {
                const phonemeData = JSON.parse(data);
                res.json(phonemeData);

                // ✅ KEEP files for debugging
                console.log("🟢 Rhubarb generated:", outputPath);
                console.log("🟢 Input audio kept:", inputPath);
            } catch (parseErr) {
                res.status(500).json({ error: "Failed to parse Rhubarb JSON" });
            }
        });
    });
});

app.get("/latest", (req, res) => {
    const uploadDir = path.join(__dirname, "uploads");

    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: "Failed to read uploads folder" });
        }

        const wavFiles = files.filter(f => f.endsWith(".wav"));
        if (wavFiles.length === 0) {
            return res.status(404).json({ error: "No wav files found" });
        }

        const sorted = wavFiles
            .map(f => ({
                name: f,
                time: fs.statSync(path.join(uploadDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

        const latestWav = sorted[0].name;
        const latestJson = latestWav + ".json";

        // build absolute URLs using the request host
        const baseUrl = `${req.protocol}://${req.get("host")}`;

        res.json({
            audio: `${baseUrl}/uploads/${latestWav}`,
            json: `${baseUrl}/uploads/${latestJson}`
        });
    });
});

app.post("/cleanup", (req, res) => {
    const { filename } = req.body;
    if (!filename) {
        return res.status(400).json({ error: "No filename provided" });
    }

    const wavPath = path.join(__dirname, "uploads", filename);
    const jsonPath = wavPath + ".json";

    // Delete wav
    fs.unlink(wavPath, (err) => {
        if (err) console.warn("⚠️ Failed to delete wav:", wavPath, err);

        // Delete json
        fs.unlink(jsonPath, (err2) => {
            if (err2) console.warn("⚠️ Failed to delete json:", jsonPath, err2);

            console.log("🗑️ Cleaned up:", filename);
            res.json({ success: true });
        });
    });
});

app.listen(8030, () =>
    console.log("✅ Rhubarb server running on http://localhost:8030/rhubarb")
);
