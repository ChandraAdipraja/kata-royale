import User from "../models/User.js";

export const profile = async (req, res) => {
  res.json({ user: req.user });
};

export const leaderboard = async (_req, res) => {
  const users = await User.find()
    .select("username totalMatch win lose winrate totalValidWords")
    .sort({ winrate: -1, win: -1, totalMatch: 1 })
    .limit(25);

  res.json({ users });
};
