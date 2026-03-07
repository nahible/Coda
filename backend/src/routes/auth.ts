import { Router } from "express";
import {
  clearSessionCookie,
  getSessionUserId,
  setSessionCookie,
} from "../lib/session.js";
import { findUserById, upsertGoogleUser } from "../lib/users.js";

const router = Router();
const DEFAULT_REDIRECT_URI = "http://localhost:5001/auth/google/callback";
const DEFAULT_FRONTEND_URL = "http://localhost:5173";

router.get("/me", async (req, res) => {
  const userId = getSessionUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { data: user, error } = await findUserById(userId);

  if (error || !user) {
    clearSessionCookie(res);
    res.status(401).json({ error: "Session is no longer valid" });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      googleId: user.google_id,
    },
  });
});

router.post("/logout", (req, res) => {
  clearSessionCookie(res);
  res.status(204).send();
});

// Redirect the user to Google's OAuth consent screen
router.get("/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || DEFAULT_REDIRECT_URI;

  if (!clientId) {
    res.status(500).json({ error: "GOOGLE_CLIENT_ID is not configured" });
    return;
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  res.redirect(authUrl.toString());
});

// Handle the callback from Google after user consents
router.get("/google/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || DEFAULT_REDIRECT_URI;
  const frontendUrl = process.env.FRONTEND_URL || DEFAULT_FRONTEND_URL;

  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: "Google OAuth credentials are not configured" });
    return;
  }

  try {
    // Exchange the authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokenRes.ok || !tokens.access_token) {
      console.error("Google token exchange failed:", tokens);
      res.status(502).json({ error: "Failed to exchange Google authorization code" });
      return;
    }

    // Fetch user profile info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const user = await userRes.json();

    if (!userRes.ok || !user.id || !user.email) {
      console.error("Google user profile fetch failed:", user);
      res.status(502).json({ error: "Failed to fetch Google profile" });
      return;
    }

    const userName =
      typeof user.name === "string" && user.name.trim().length > 0 ? user.name.trim() : user.email;

    const { data: savedUser, error } = await upsertGoogleUser({
      googleId: String(user.id),
      email: String(user.email),
      name: userName,
    });

    if (error || !savedUser) {
      console.error("Supabase error:", error);
      res.status(500).json({ error: "Failed to save user" });
      return;
    }

    console.log("Saved user:", savedUser);

    setSessionCookie(res, savedUser.id);
    res.redirect(frontendUrl);
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;
