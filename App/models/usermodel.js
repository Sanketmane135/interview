let mongoose = require("mongoose");
let Schema = mongoose.Schema;

const userschema = new Schema(
  {
    //define schema
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gmail: { type: String, required: true },
    password: { type: String, required: true },
  }
);
let usermodel = mongoose.models.users || mongoose.model("users", userschema);
module.exports = usermodel;
