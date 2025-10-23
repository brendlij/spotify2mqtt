import "dotenv/config";
import express from "express";
import SpotifyWebApi from "spotify-web-api-node";

const PORT = process.env.AUTH_PORT || 9999;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;

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
    res.send(
      `<pre>REFRESH TOKEN:\n${refresh}\n\nPaste in .env: (SPOTIFY_REFRESH_TOKEN)</pre>`
    );
    console.log("REFRESH TOKEN:", refresh);
    setTimeout(() => process.exit(0), 1000);
  } catch (e) {
    console.error(e);
    res.status(500).send("Auth error");
  }
});

app.listen(PORT, () => {
  console.log(`Open http://localhost:${PORT} in your browser to auth Spotify`);
});
