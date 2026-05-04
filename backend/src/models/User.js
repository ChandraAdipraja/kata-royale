import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    totalMatch: { type: Number, default: 0 },
    win: { type: Number, default: 0 },
    lose: { type: Number, default: 0 },
    winrate: { type: Number, default: 0 },
    totalValidWords: { type: Number, default: 0 },
    avatar: { type: String, default: "Avatar1.png" }
  },
  { timestamps: true }
);

userSchema.methods.recalculateWinrate = function recalculateWinrate() {
  this.winrate = this.totalMatch > 0 ? Number(((this.win / this.totalMatch) * 100).toFixed(2)) : 0;
};

export default mongoose.model("User", userSchema);
