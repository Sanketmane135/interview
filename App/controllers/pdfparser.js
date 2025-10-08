const pdf = require("pdf-parse");
const multer = require("multer");

// Use memory storage (no file saved to disk)
const upload = multer({ storage: multer.memoryStorage() });

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
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    // Access the PDF directly from memory
    const dataBuffer = req.file.buffer;

    // Parse PDF content
    const data = await pdf(dataBuffer);

    const cleanedText = cleanPdfText(data.text);

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
