import { Router } from "express";
import { login, logout, me, register } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import passport from "../config/passport.js";
import { signToken } from "../utils/auth.js";

const router = Router();

const normalizeUrl = (url) => url.replace(/\/+$/, "");
const getClientUrl = () => {
  const [clientUrl] = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return normalizeUrl(clientUrl);
};

const oauthSuccessRedirect = (req, res) => {
  const token = signToken(req.user);
  const clientUrl = getClientUrl();

  res.redirect(`${clientUrl}/oauth/callback?token=${token}`);
};

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, me);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${getClientUrl()}/login`,
    session: false,
  }),
  oauthSuccessRedirect,
);

router.get(
  "/discord",
  passport.authenticate("discord", {
    scope: ["identify", "email"],
    session: false,
  }),
);

router.get(
  "/discord/callback",
  passport.authenticate("discord", {
    failureRedirect: `${getClientUrl()}/login`,
    session: false,
  }),
  oauthSuccessRedirect,
);

export default router;
