import User from "../models/User.js";
import { syncUserAvatarInRooms, syncUserNameInRooms } from "../sockets/gameSocket.js";

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

export const updateProfile = async (req, res) => {
  const username = String(req.body.username || "").trim();

  if (username.length < 3) {
    return res.status(400).json({ message: "Username minimal 3 karakter" });
  }

  if (username.length > 24) {
    return res.status(400).json({ message: "Username maksimal 24 karakter" });
  }

  if (!/^[a-zA-Z0-9_ ]+$/.test(username)) {
    return res.status(400).json({ message: "Username hanya boleh huruf, angka, spasi, dan underscore" });
  }

  const exists = await User.exists({ _id: { $ne: req.user._id }, username });
  if (exists) {
    return res.status(409).json({ message: "Username sudah dipakai" });
  }

  req.user.username = username;
  await req.user.save();
  await syncUserNameInRooms(req.app.get("io"), req.user._id, username);

  res.json({ user: userPayload(req.user) });
};

export const leaderboard = async (_req, res) => {
  const users = await User.find()
    .select("username win totalValidWords avatar")
    .sort({ win: -1, totalValidWords: -1 })
    .limit(25);

  res.json({ users });
};
