const fs = require("fs");
const path = require("path");
const pdf = require("pdf-parse");
const multer = require("multer");

// Configure multer (store uploaded files in 'uploads/' folder)
const upload = multer({ dest: "uploads/" });

function cleanPdfText(rawText) {
  return rawText
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/^\s+/gm, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// PDF parsing controller
const parsePdf = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const filePath = path.resolve(req.file.path);

    console.log("Uploaded PDF file path:", filePath);

    // Read file as buffer
    const dataBuffer = fs.readFileSync(filePath);

    // Parse PDF
    const data = await pdf(dataBuffer);

    const cleanedText = cleanPdfText(data.text);

    // Remove uploaded file after parsing (optional)
    fs.unlinkSync(filePath);

    res.json({
      numpages: data.numpages,
      info: data.info,
      text: cleanedText,
    });
  } catch (err) {
    console.error("PDF Parsing Error:", err.message);
    res.status(500).json({
      error: "Failed to parse PDF",
      details: err.message,
    });
  }
};

module.exports = { parsePdf, upload };
