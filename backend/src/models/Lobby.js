import mongoose from "mongoose";

const lobbyPlayerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    guestId: { type: String, default: null },
    socketId: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String },
    isGuest: { type: Boolean, default: true },
    isHost: { type: Boolean, default: false },
    ready: { type: Boolean, default: false },
    hp: { type: Number, default: 3 },
    alive: { type: Boolean, default: true }
  },
  { _id: false }
);

const lobbySchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    name: { type: String, required: true, trim: true },
    players: [lobbyPlayerSchema],
    settings: {
      maxPlayers: { type: Number, default: 4 },
      hp: { type: Number, default: 3 },
      timer: { type: Number, default: 15 },
      isPublic: { type: Boolean, default: true },
      categoryChallenge: { type: Boolean, default: false }
    },
    status: { type: String, enum: ["waiting", "playing", "finished"], default: "waiting" }
  },
  { timestamps: true }
);

export default mongoose.model("Lobby", lobbySchema);
