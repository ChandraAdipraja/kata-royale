import mongoose from "mongoose";

const wordSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  isValid: { type: Boolean, required: true },
  checkedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Word", wordSchema);
