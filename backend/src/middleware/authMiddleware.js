import User from "../models/User.js";
import { verifyToken } from "../utils/auth.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;

    if (!token) return res.status(401).json({ message: "Token tidak ditemukan" });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User tidak ditemukan" });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token tidak valid" });
  }
};
