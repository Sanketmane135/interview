let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const interviewSchema = new Schema(
  {
  isInterviewDone: {type: Boolean,default: false },
  userMail:{type:String, required:true},
  userData: {
    candidatename: { type: String, required: true },
    email: { type: String, required: true },
    jobRole: { type: String },
    experience: { type: String },
    locationPreference: { type: String },
    resumefile:{type:String,required:true}
  },
  feedbackData: {
    strengths: { type: [String], default: [] },
    growthOpportunities: { type: [String], default: [] },
    skills: {
      communication: { type: Number, default: 0 },
      strategy: { type: Number, default: 0 },
      teamwork: { type: Number, default: 0 },
      adaptability: { type: Number, default: 0 },
    },
    comments: { type: String },
  },
    answers_feedback: [
        {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        feedback: { type: String },
        },
    ]
}, { timestamps: true });

let userdatamodel= mongoose.models.userdata || mongoose.model("userdata", interviewSchema);
module.exports=userdatamodel;