const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const usermodel = require("../models/usermodel");


const otps = new Map();

// Rate limiter - per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // max requests per window
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,           // your-email@gmail.com
    pass: process.env.EMAIL_APP_PASSWORD,   // app password (not regular password)
  },
});

function createOtp() {
  const otp = crypto.randomInt(100000, 1000000).toString(); // 6-digit
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  return { otp, expiresAt, lastSent: Date.now(), attempts: 0, resends: 0 };
}
const OTP_COOLDOWN = 30 * 1000; // 30 seconds
const MAX_RESENDS = 3;


const optsend = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  const existing = otps.get(email);

  // Cooldown for resending
  if (existing && Date.now() - existing.lastSent < OTP_COOLDOWN) {
    const wait = Math.ceil((OTP_COOLDOWN - (Date.now() - existing.lastSent)) / 1000);
    return res.status(429).json({ error: `Please wait ${wait}s before requesting again` });
  }

  // Resend limit
  if (existing && existing.resends >= MAX_RESENDS) {
    otps.delete(email);
    return res.status(429).json({ error: "Resend limit reached. Request new OTP later." });
  }

  const { otp, expiresAt } = createOtp();
  const record = existing || { otp, expiresAt, attempts: 0, resends: 0, lastSent: Date.now() };

  if (existing) {
    record.otp = otp;
    record.expiresAt = expiresAt;
    record.lastSent = Date.now();
    record.resends += 1;
  }

  otps.set(email, record);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Registration OTP for ResumeIq",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
       html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #2E86C1;">ResumeIQ Verification</h2>
        <p>Hello,</p>
        <p>Your one-time password (OTP) for verifying your email is:</p>
        <h1 style="letter-spacing: 4px; color: #000;">${otp}</h1>
        <p>This OTP is valid for <strong>5 minutes</strong>.</p>
        <p>Please do not share this OTP with anyone. If you did not request this, you can safely ignore this email.</p>
        <hr>
        <p style="font-size: 12px; color: #888;">ResumeIQ Team</p>
        </div>
  `,
    });
    return res.json({ ok: true, message: existing ? "OTP resent" : "OTP sent" });
  } catch (err) {
    console.error("mail error", err);
    return res.status(500).json({ error: "failed to send email" });
  }
};

const verifyOtp = (req, res) => {

  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "email & otp required" });

  const record = otps.get(email);
  if (!record) return res.status(400).json({ error: "no otp found or expired" });

  if (Date.now() > record.expiresAt) {
    otps.delete(email);
    return res.status(400).json({ error: "otp expired" });
  }

    record.attempts = (record.attempts || 0) + 1;
  if (record.attempts > 5) {
    otps.delete(email);
    return res.status(429).json({ error: "too many attempts" });
  }

  if (record.otp === otp) {
    otps.delete(email);
    // create session / JWT here
    return res.json({ ok: true, message: "verified" });
  } else {
    otps.set(email, record);
    return res.status(400).json({ error: "invalid otp" });
  }
}

let createUser = async (req, res) => {
  try {
    const { firstName, lastName, gmail, password } = req.body;

    if (!firstName || !lastName || !gmail || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let existingUser = await usermodel.findOne({ gmail });

    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    let newUser = new usermodel({ firstName, lastName, gmail, password });
    await newUser.save();

    return res.json({ message: "User created successfully", userId: newUser._id });

  } catch (error) {
    res.status(500).json({ error: error.message });
  } 
};

let checkUser = async (req, res) => {
  try {
    const { gmail, password } = req.body;
    if (!gmail || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    let user = await usermodel.findOne({ gmail, password });
    if (!user) {
      return res.json({ message: "Invalid credentials" });
    }
    return res.json({ message: "Login successful", userId: user._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { optsend, limiter, verifyOtp ,createUser, checkUser};