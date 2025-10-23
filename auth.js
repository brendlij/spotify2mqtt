import "dotenv/config";
import express from "express";
import SpotifyWebApi from "spotify-web-api-node";

const PORT = parseInt(process.env.AUTH_PORT || "8889", 10);
const REDIRECT_HOST = process.env.REDIRECT_HOST || "127.0.0.1"; // must be loopback for Spotify
const REDIRECT_URI = `http://${REDIRECT_HOST}:${PORT}/callback`;

const s = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: REDIRECT_URI,
});

const scopes = ["user-read-playback-state", "user-read-currently-playing"];

const app = express();

app.get("/", (_req, res) => {
  const url = s.createAuthorizeURL(scopes, "xyz");
  res.redirect(url);
});

app.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const data = await s.authorizationCodeGrant(code);
    const refresh = data.body.refresh_token;
    console.log("REFRESH TOKEN:", refresh);
    res.type("text/plain").send(
      `REFRESH TOKEN:
${refresh}

Copy this value into .env as SPOTIFY_REFRESH_TOKEN
Then run: docker compose up -d`
    );
    setTimeout(() => process.exit(0), 500);
  } catch (e) {
    console.error(e);
    res.status(500).send("Auth error: " + (e?.message || e));
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Open http://${REDIRECT_HOST}:${PORT} in your browser to auth Spotify`
  );
  console.log(
    `Make sure this exact Redirect URI exists in your Spotify App: ${REDIRECT_URI}`
  );
});
