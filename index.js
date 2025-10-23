import "dotenv/config";
import mqtt from "mqtt";
import SpotifyWebApi from "spotify-web-api-node";

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

const TOPIC_STATE = `${MQTT_TOPIC_BASE}/state`;
const TOPIC_CONTEXT = `${MQTT_TOPIC_BASE}/context`;
const TOPIC_QUEUE = `${MQTT_TOPIC_BASE}/queue`;
const TOPIC_DEVICE = `${MQTT_TOPIC_BASE}/device`;

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

function pub(topic, payload) {
  client.publish(topic, JSON.stringify(payload), { retain: true });
}

function shortTrack(t) {
  if (!t) return null;
  return {
    type: t.type || "track",
    title: t.name || "",
    artist: (t.artists || []).map((a) => a.name).join(", "),
    album: t.album?.name,
    duration_ms: t.duration_ms,
  };
}

function shortEpisode(e) {
  if (!e) return null;
  return {
    type: "episode",
    title: e.name || "",
    show: e.show?.name,
    publisher: e.show?.publisher,
    duration_ms: e.duration_ms,
    explicit: e.explicit,
  };
}

async function fetchAll() {
  const { body: token } = await s.refreshAccessToken();
  s.setAccessToken(token.access_token);

  // Playback-State (mit additional_types=episode für Podcasts)
  const { body: playback } = await s.getMyCurrentPlaybackState({
    additional_types: "episode",
  });
  // STATE
  const item = playback?.item;
  const type = playback?.currently_playing_type; // track|episode|ad|unknown
  const statePayload = {
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
  pub(TOPIC_STATE, statePayload);

  // DEVICE
  const d = playback?.device;
  if (d) {
    pub(TOPIC_DEVICE, {
      name: d.name,
      type: d.type,
      volume_percent: d.volume_percent,
      is_active: d.is_active,
      is_private_session: d.is_private_session,
    });
  }

  // CONTEXT (Playlist/Album/Artist/Show/Audiobook/Chapter")
  let ctxPayload = null;
  const ctx = playback?.context; // has { type, uri, href }
  if (ctx?.uri && ctx?.type) {
    ctxPayload = { type: ctx.type, uri: ctx.uri, href: ctx.href };
    try {
      if (ctx.type === "playlist") {
        const id = ctx.uri.split(":").pop();
        const { body } = await s.getPlaylist(id, {
          fields: "name,owner(display_name,id)",
        });
        ctxPayload.name = body.name;
        ctxPayload.owner = body.owner?.display_name || body.owner?.id;
        // simple heuristic for "radio/autoplay"
        ctxPayload.heuristic_radio =
          ctxPayload.owner?.toLowerCase() === "spotify";
      } else if (ctx.type === "album") {
        const id = ctx.uri.split(":").pop();
        const { body } = await s.getAlbum(id, { fields: "name,artists(name)" });
        ctxPayload.name = body.name;
        ctxPayload.artist = (body.artists || []).map((a) => a.name).join(", ");
      } else if (ctx.type === "artist") {
        const id = ctx.uri.split(":").pop();
        const { body } = await s.getArtist(id);
        ctxPayload.name = body.name;
      } else if (ctx.type === "show") {
        const id = ctx.uri.split(":").pop();
        const { body } = await s.getShow(id, { market: "DE" });
        ctxPayload.name = body.name;
        ctxPayload.publisher = body.publisher;
      }
      // Audiobooks: wenn URI mit spotify:audiobook:/spotify:chapter: kommt – Märkte beachten
      if (
        ctx.uri.startsWith("spotify:audiobook:") ||
        ctx.uri.startsWith("spotify:chapter:")
      ) {
        ctxPayload.type = "audiobook";
        ctxPayload.note =
          "Audiobooks API nur in ausgewählten Märkten verfügbar";
      }
    } catch {
      /* ignore lookup errors */
    }
  }
  if (ctxPayload) pub(TOPIC_CONTEXT, ctxPayload);

  // QUEUE
  try {
    const { body: queue } = await s.getMyQueue(); // requires user-read-currently-playing
    const now = queue?.currently_playing;
    const q = (queue?.queue || []).map((it) =>
      it.type === "episode" ? shortEpisode(it) : shortTrack(it)
    );
    pub(TOPIC_QUEUE, {
      currently_playing: now
        ? now.type === "episode"
          ? shortEpisode(now)
          : shortTrack(now)
        : null,
      queue: q,
    });
  } catch {
    // Queue nicht verfügbar – z.B. Scope fehlt
  }
}

client.on("connect", () => {
  setInterval(
    () =>
      fetchAll().catch(() => {
        pub(TOPIC_STATE, { is_playing: false, error: true });
      }),
    parseInt(POLL_MS, 10)
  );
  // initial schnell
  fetchAll().catch(() => pub(TOPIC_STATE, { is_playing: false, error: true }));
});
