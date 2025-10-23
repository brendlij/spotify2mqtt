import "dotenv/config";
import mqtt from "mqtt";
import SpotifyWebApi from "spotify-web-api-node";

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  MQTT_URL = "mqtt://localhost:1883",
  MQTT_TOPIC = "homelab/spotify/now",
  MQTT_USERNAME,
  MQTT_PASSWORD,
  POLL_MS = "2000",
} = process.env;

const pollMs = parseInt(POLL_MS, 10);

const s = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
});
s.setRefreshToken(SPOTIFY_REFRESH_TOKEN);

// MQTT Optionen (Auth nur wenn gesetzt)
const mqttOpts = {
  reconnectPeriod: 2000,
  ...(MQTT_USERNAME && { username: MQTT_USERNAME }),
  ...(MQTT_PASSWORD && { password: MQTT_PASSWORD }),
};

const client = mqtt.connect(MQTT_URL, mqttOpts);

async function fetchAndPublish() {
  try {
    const { body: token } = await s.refreshAccessToken();
    s.setAccessToken(token.access_token);

    const { body } = await s.getMyCurrentPlaybackState();
    let payload = { is_playing: false };
    if (body && body.item) {
      payload = {
        is_playing: body.is_playing,
        title: body.item.name || "",
        artist: (body.item.artists || []).map((a) => a.name).join(", "),
        progress_ms: body.progress_ms || 0,
        duration_ms: body.item.duration_ms || 1,
      };
    }
    client.publish(MQTT_TOPIC, JSON.stringify(payload), { retain: true });
  } catch (e) {
    client.publish(
      MQTT_TOPIC,
      JSON.stringify({ is_playing: false, error: true }),
      { retain: true }
    );
  }
}

client.on("connect", () => {
  console.log(`[MQTT] Connected to ${MQTT_URL}`);
  setInterval(fetchAndPublish, pollMs);
});

// first fetch after startup
setTimeout(fetchAndPublish, 1000);
