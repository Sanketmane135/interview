let axios = require('axios'); 
const dotenv = require('dotenv'); 
dotenv.config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

 const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


let givefeedback = async (req, res) => {
  try {
    const { qaList } = req.body;

    if (!Array.isArray(qaList)) {
      return res.status(400).json({ error: "Data should be in array format" });
    }

    if (qaList.length <= 0) {
      return res.status(400).json({ error: "Empty array received" });
    }

    const prompt = `
      You are an AI interviewer assistant.
      The user has answered interview questions based on their resume.
      Here is the Q&A array: ${JSON.stringify(qaList)}

      Based on this, return structured feedback in *valid JSON only*.
      Follow exactly this structure:
{
          "strengths": [ "..." ],
          "growth_opportunities": [ "..." ],
          "skills": {
            "communication": <percentage>,
            "strategy": <percentage>,
            "teamwork": <percentage>,
            "adaptability": <percentage>
          }
        },
        "answers_feedback": [
          { 
            "question": "...",
            "answer": "...",
            "feedback": "..."
          }
        ]
    
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // 🧹 Step 1: Remove markdown formatting
    text = text.replace(/```json|```/g, "").trim();

    // 🧹 Step 2: Parse safely
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse failed, raw text:", text);
      return res.status(500).json({ error: "AI returned invalid JSON", raw: text });
    }

    res.json({
      message: "Array received",
      data: parsedData
    });

  } catch (err) {
    console.error("Error in givefeedback:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


module.exports = { givefeedback };
