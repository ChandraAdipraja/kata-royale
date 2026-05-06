import bcrypt from "bcrypt";
import crypto from "crypto";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

const API_URL = process.env.API_URL || "http://localhost:5000";

const makeUniqueUsername = async (baseName) => {
  const fallbackName = `player-${crypto.randomBytes(3).toString("hex")}`;
  const normalized = (baseName || fallbackName)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 18);
  const root = normalized.length >= 3 ? normalized : fallbackName;

  let username = root;
  let counter = 1;
  while (await User.exists({ username })) {
    username = `${root}${counter}`;
    counter += 1;
  }

  return username;
};

const findOrCreateOAuthUser = async ({ email, displayName }) => {
  if (!email) {
    throw new Error("Akun OAuth tidak memiliki email yang dapat digunakan");
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) return existingUser;

  const username = await makeUniqueUsername(displayName || normalizedEmail.split("@")[0]);
  const password = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);

  return User.create({
    username,
    email: normalizedEmail,
    password
  });
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${API_URL}/api/auth/google/callback`
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const user = await findOrCreateOAuthUser({
          email,
          displayName: profile.displayName
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: `${API_URL}/api/auth/discord/callback`,
      scope: ["identify", "email"]
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const user = await findOrCreateOAuthUser({
          email: profile.email,
          displayName: profile.username || profile.global_name
        });

        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
