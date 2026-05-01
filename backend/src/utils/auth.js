import jwt from "jsonwebtoken";

export const signToken = (user) =>
  jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: "7d"
  });

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
