const mongoose = require("mongoose");

const credentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  website: {
    type: String,
  },
  category: {
    type: String,
    enum: ["personal", "work", "finance", "social", "other"],
    default: "other",
  },
}, { timestamps: true });

module.exports = mongoose.model("Credentials", credentialSchema);