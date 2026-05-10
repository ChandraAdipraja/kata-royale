import mongoose from "mongoose";

const categoryValidationSchema = new mongoose.Schema({
  word: { type: String, required: true, lowercase: true, trim: true },
  category: { type: String, required: true, lowercase: true, trim: true },
  isValid: { type: Boolean, required: true },
  checkedAt: { type: Date, default: Date.now }
});

categoryValidationSchema.index({ word: 1, category: 1 }, { unique: true });

export default mongoose.model("CategoryValidation", categoryValidationSchema);
