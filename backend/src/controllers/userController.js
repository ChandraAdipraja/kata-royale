import User from "../models/User.js";
import { syncUserAvatarInRooms } from "../sockets/gameSocket.js";

const allowedAvatars = new Set(Array.from({ length: 12 }, (_, index) => `Avatar${index + 1}.png`));

const userPayload = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  totalMatch: user.totalMatch,
  win: user.win,
  lose: user.lose,
  winrate: user.winrate,
  totalValidWords: user.totalValidWords,
  avatar: user.avatar || "Avatar1.png"
});

export const profile = async (req, res) => {
  res.json({ user: userPayload(req.user) });
};

export const updateAvatar = async (req, res) => {
  const { avatar } = req.body;
  if (!allowedAvatars.has(avatar)) {
    return res.status(400).json({ message: "Avatar tidak valid" });
  }

  req.user.avatar = avatar;
  await req.user.save();
  await syncUserAvatarInRooms(req.app.get("io"), req.user._id, avatar);

  res.json({ user: userPayload(req.user) });
};

export const leaderboard = async (_req, res) => {
  const users = await User.find()
    .select("username totalMatch win lose winrate totalValidWords avatar")
    .sort({ winrate: -1, win: -1, totalMatch: 1 })
    .limit(25);

  res.json({ users });
};
