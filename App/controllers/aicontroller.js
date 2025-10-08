let axios = require('axios'); 
const dotenv = require('dotenv'); 
dotenv.config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini setup
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });


 const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// In-memory user history { userId: {...} }
let userHistory = {};

// ---------------- Start Interview ----------------
let startInterview = async (req, res) => {
  try {
    const { userId, fullname, jobrole, experience, questionlevel, questions, locationpreference, resumeText } = req.body;

    if (!userId || !fullname || !jobrole || !experience || !questionlevel || !questions || !locationpreference || !resumeText) {
      return res.status(400).json({ error: "Missing required fields" });
    }
 const prompt = `
      You are an AI interviewer.
      Candidate: ${fullname}
      Job Role: ${jobrole}
      Experience: ${experience}
      Location Preference: ${locationpreference}
      Difficulty Level: ${questionlevel}
      Resume Summary: ${resumeText}

      Generate exactly ${questions} interview questions relevant to the role,
      covering technical, skill mentioned in data and behavioral aspects.
      Return questions as a JSON object in this exact format:

      {
        "questions": [
          {
            "questionNo": 1,
            "question": "First question text"
          },
          {
            "questionNo": 2,
            "question": "Second question text"
          }
        ]
      }
      Do not include any markdown, backticks, or extra text.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(text);
    } catch (e) {
      parsedQuestions = text
        .split("\n")
        .map((q) => q.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
    }

    // Save in memory
    userHistory[userId] = {
      fullname,
      jobrole,
      experience,
      questionlevel,
      locationpreference,
      questions: parsedQuestions,
      answers: [],
    };

    res.json({ message: "Interview started", questions: parsedQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- Evaluate Answer ----------------
let evaluateAnswer = async (req, res) => {
  try {
    const { userId, questionNo, question, answer } = req.body;

    if (!userId || !questionNo || !question || !answer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!userHistory[userId]) {
      return res.status(404).json({ error: "Interview not found. Start interview first." });
    }

    const prompt = `
      You are evaluating an interview answer.
      Question (${questionNo}): ${question}
      Candidate's Answer: ${answer}

      Provide feedback on correctness, depth, and improvement areas.
      Respond in JSON with:
      {
        "questionNo": ${questionNo},
        "feedback": "string",
        "score": "number out of 10"
      }
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    let evaluation;
    try {
      evaluation = JSON.parse(text);
    } catch (e) {
      evaluation = { questionNo, feedback: text, score: "N/A" };
    }

    // Save answer
    userHistory[userId].answers.push({
      questionNo,
      question,
      answer,
      feedback: evaluation.feedback,
      score: evaluation.score,
    });

    res.json({ message: "Answer evaluated", evaluation });
  } catch (error) {
    
    res.status(500).json({ error: error.message });
  }
};

// ---------------- Get Interview History ----------------
let getHistory = (req, res) => {
  const { userId } = req.params;

  if (!userHistory[userId]) {
    return res.status(404).json({ error: "No history found for this user" });
  }

  res.json(userHistory[userId]);
};

module.exports={startInterview,evaluateAnswer,getHistory}