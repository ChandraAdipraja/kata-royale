import bcrypt from "bcrypt";
import User from "../models/User.js";
import { signToken } from "../utils/auth.js";

const userPayload = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  totalMatch: user.totalMatch,
  win: user.win,
  lose: user.lose,
  winrate: user.winrate,
  totalValidWords: user.totalValidWords
});

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, dan password wajib diisi" });
    }

    const exists = await User.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
    if (exists) return res.status(409).json({ message: "Username atau email sudah dipakai" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, password: hashed });

    res.status(201).json({ token: signToken(user), user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ message: "Gagal register" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: "Email atau password salah" });

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) return res.status(401).json({ message: "Email atau password salah" });

    res.json({ token: signToken(user), user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ message: "Gagal login" });
  }
};

export const me = async (req, res) => {
  res.json({ user: userPayload(req.user) });
};

export const logout = async (_req, res) => {
  res.json({ message: "Logout berhasil" });
};
