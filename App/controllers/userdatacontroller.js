const UserDataModel = require("../models/userdata.model");

const addUserdata = async (req, res) => {
  try {
    const {
      isInterviewDone,
      userMail,
      candidatename,
      email,
      jobRole,
      experience,
      locationPreference,
      resumefile,
      feedbackData,
      answers_feedback,
    } = req.body;

    // Create a new document
    const newUserData = new UserDataModel({
      isInterviewDone: isInterviewDone || false,
      userMail,
      userData: {
        candidatename,
        email,
        jobRole,
        experience,
        locationPreference,
        resumefile
      },
      feedbackData: feedbackData || {},
      answers_feedback: answers_feedback || [],
    });

    // Save to MongoDB
    const savedData = await newUserData.save();

    return res.status(201).json({
      success: true,
      message: "Interview data added successfully",
      data: savedData,
    });
  } catch (error) {
    console.error("❌ Error adding user data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding interview data",
      error: error.message,
    });
  }
};



const updateUserdata = async (req, res) => {
  try {
    const { id } = req.params; // <-- getting id from URL (e.g., /update/:id)
    const {
      isInterviewDone,
      feedbackData,
      answers_feedback,
      userData,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Record ID is required to update data",
      });
    }

    // Build dynamic update object
    const updateFields = {};
    if (typeof isInterviewDone !== "undefined") updateFields.isInterviewDone = isInterviewDone;
    if (feedbackData) updateFields.feedbackData = feedbackData;
    if (answers_feedback) updateFields.answers_feedback = answers_feedback;
    if (userData) updateFields.userData = userData;

    // Update document
    const updatedRecord = await UserDataModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true } // returns updated doc
    );

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: "No record found with this ID",
      });
    }

    res.status(200).json({
      success: true,
      message: "Interview data updated successfully",
      data: updatedRecord,
    });
  } catch (error) {
    console.error("❌ Error updating interview data:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating interview data",
      error: error.message,
    });
  }
};


const getUserCreatedData = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email  is required",
      });
    }

    // Find all interview records created by this user
    const userData = await UserDataModel.find({ userMail: email });

    if (!userData || userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No data found for this user email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview data fetched successfully",
      total: userData.length,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching interview data by user email:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching interview data",
      error: error.message,
    });
  }
};

module.exports = { addUserdata,updateUserdata ,getUserCreatedData};
