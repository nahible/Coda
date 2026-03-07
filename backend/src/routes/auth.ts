import { Router } from "express";

const router = Router();

// Redirect the user to Google's OAuth consent screen
router.get("/google", async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5001/auth/google/callback";

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId || "");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  await res.redirect(authUrl.toString());
});

// Handle the callback from Google after user consents
router.get("/google/callback", async (req, res) => {
  const code = String(req.query.code || "");

  if (!code) {
    res.status(400).json({ error: "Missing authorization code" });
    return;
  }

  try {
    // Exchange the authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:5001/auth/google/callback",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    // Fetch user profile info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const user = await userRes.json();

    // TODO: Create or find user in your database, generate a session/JWT, etc.
    console.log("Authenticated user:", user);

    // For now, redirect to the frontend with some basic info
    await res.redirect(`http://localhost:5173?login=success`);
  } catch (err) {
    console.error("OAuth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

export default router;
