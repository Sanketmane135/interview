// index.js
const express = require("express");
const cors = require("cors");
let mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const { parsePdf,upload } = require("./App/controllers/pdfparser");
const {  startInterview } = require("./App/controllers/aicontroller");
const { givefeedback } = require("./App/controllers/feedbackcontroller");
const { limiter, optsend, verifyOtp, createUser, checkUser } = require("./App/controllers/logincontroller");

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Hello World");
});

// PDF parser route (reads a local PDF from project folder)
app.post("/parse-pdf", upload.single("file"), parsePdf);

app.post("/interviwer",startInterview);

app.post("/givefeedback",givefeedback);

app.post("/send-email-otp", limiter, optsend);

app.post("/verify-email-otp", verifyOtp);

app.post("/create-user",  createUser);

app.post("/login-user",  checkUser);



mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("✅Connected to database"))
  .catch(err => console.log("Error connecting to database", err));

// Start server
app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});
