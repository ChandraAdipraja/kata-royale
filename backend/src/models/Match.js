import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  players: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      guestId: String,
      username: String,
      avatar: String,
      isGuest: Boolean,
      hp: Number,
      alive: Boolean
    }
  ],
  winner: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestId: String,
    username: String,
    avatar: String,
    isGuest: Boolean
  },
  wordsUsed: [String],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Match", matchSchema);
