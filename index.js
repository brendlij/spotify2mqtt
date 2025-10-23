import "dotenv/config";
import mqtt from "mqtt";
import SpotifyWebApi from "spotify-web-api-node";
import fetch from "node-fetch";

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  MQTT_URL = "mqtt://localhost:1883",
  MQTT_TOPIC_BASE = "homelab/spotify",
  MQTT_USER,
  MQTT_PASS,
  POLL_MS = "2000",
} = process.env;

const s = new SpotifyWebApi({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET,
});
s.setRefreshToken(SPOTIFY_REFRESH_TOKEN);

const mqttOpts = {
  reconnectPeriod: 2000,
  ...(MQTT_USER && { username: MQTT_USER }),
  ...(MQTT_PASS && { password: MQTT_PASS }),
};
const client = mqtt.connect(MQTT_URL, mqttOpts);

// --- MQTT topics ---
const T_STATE = `${MQTT_TOPIC_BASE}/state`;
const T_CONTEXT = `${MQTT_TOPIC_BASE}/context`;
const T_QUEUE = `${MQTT_TOPIC_BASE}/queue`;
const T_DEVICE = `${MQTT_TOPIC_BASE}/device`;
const T_IMAGE = `${MQTT_TOPIC_BASE}/image`;

function pub(topic, data) {
  client.publish(topic, JSON.stringify(data), { retain: true });
}

function shortTrack(t) {
  if (!t) return null;
  return {
    type: t.type,
    title: t.name,
    artist: (t.artists || []).map((a) => a.name).join(", "),
    album: t.album?.name,
    duration_ms: t.duration_ms,
  };
}

function shortEpisode(e) {
  if (!e) return null;
  return {
    type: "episode",
    title: e.name,
    show: e.show?.name,
    publisher: e.show?.publisher,
    duration_ms: e.duration_ms,
  };
}

async function fetchCoverImage(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // base64 PNG (nicht zu groß)
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function fetchAll() {
  try {
    const { body: token } = await s.refreshAccessToken();
    s.setAccessToken(token.access_token);

    const { body: playback } = await s.getMyCurrentPlaybackState({
      additional_types: "episode",
    });
    const item = playback?.item;
    const type = playback?.currently_playing_type;

    const state = {
      is_playing: playback?.is_playing ?? false,
      type,
      ...(type === "track" ? shortTrack(item) : {}),
      ...(type === "episode" ? shortEpisode(item) : {}),
      progress_ms: playback?.progress_ms ?? 0,
      duration_ms: item?.duration_ms ?? 0,
      shuffle_state: playback?.shuffle_state ?? false,
      repeat_state: playback?.repeat_state ?? "off",
      timestamp: Date.now(),
    };
    pub(T_STATE, state);

    if (playback?.device) {
      const d = playback.device;
      pub(T_DEVICE, {
        name: d.name,
        type: d.type,
        volume_percent: d.volume_percent,
        is_active: d.is_active,
      });
    }

    if (playback?.context?.uri) {
      const ctx = playback.context;
      pub(T_CONTEXT, { type: ctx.type, uri: ctx.uri, href: ctx.href });
    }

    // cover image
    if (item?.album?.images?.length) {
      const cover = item.album.images[0].url;
      const img64 = await fetchCoverImage(cover);
      if (img64) pub(T_IMAGE, { base64: img64, url: cover });
    } else if (item?.images?.length) {
      // episodes/shows
      const cover = item.images[0].url;
      const img64 = await fetchCoverImage(cover);
      if (img64) pub(T_IMAGE, { base64: img64, url: cover });
    }

    // queue
    try {
      const { body: queue } = await s.getMyQueue();
      pub(T_QUEUE, {
        current: queue?.currently_playing
          ? shortTrack(queue.currently_playing)
          : null,
        next: (queue?.queue || []).slice(0, 5).map(shortTrack),
      });
    } catch (e) {
      // ignore queue errors
    }
  } catch (e) {
    console.error("[spotify2mqtt] Error:", e.message);
    pub(T_STATE, { is_playing: false, error: true });
  }
}

client.on("connect", () => {
  console.log(`[MQTT] Connected to ${MQTT_URL}`);
  setInterval(fetchAll, parseInt(POLL_MS, 10));
  fetchAll();
});
