# 🎵 spotify2mqtt

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22%2B-brightgreen" alt="Node.js 22+ Required">
  <img src="https://img.shields.io/badge/MQTT-Publisher-blue" alt="MQTT Publisher">
  <img src="https://img.shields.io/badge/Docker-Ready-informational" alt="Docker Ready">
</p>

Fetches your **currently playing Spotify track** and publishes it via **MQTT**  
→ perfect for Home Assistant, ESP displays, dashboards, etc.

---

## 🚀 Features

- Realtime Spotify playback data via MQTT
- Works locally or on remote servers (SSH tunnel supported)
- Publishes track, artist, album, progress, device, queue, and cover image (base64)
- Secure auth flow using Spotify’s official API
- Lightweight Docker setup (Node 22 Alpine)

---

## 🧱 Setup Guide

### 1️⃣ Clone the repo

```bash
git clone https://github.com/brendlij/spotify2mqtt.git
cd spotify2mqtt
```

### 2️⃣ Create your Spotify App

- Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/applications)
- Click **Create App**
- Add a Redirect URI (must be exact!):
  ```
  http://127.0.0.1:8889/callback
  ```
- Enable ✅ Web API
- Copy your Client ID and Client Secret

### 3️⃣ Create .env

```bash
cp .env.example .env
```

Then edit it:

```ini
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=      # leave empty for now

MQTT_URL=mqtt://192.168.x.x:1883
MQTT_USER=optional
MQTT_PASS=optional
MQTT_TOPIC_BASE=homelab/spotify
POLL_MS=2000

AUTH_PORT=8889
REDIRECT_HOST=127.0.0.1
```

---

## ⚡ Authorization (get your Refresh Token)

You must do this once to authorize Spotify.
There are two ways depending on where you run Docker:

### 🖥️ Local machine

If you’re running Docker on your own PC:

```bash
docker compose build --no-cache
docker compose run --rm -p 8889:8889 spotify2mqtt npm run auth
```

Then open in your browser:

```
http://127.0.0.1:8889
```

→ Log in → You’ll see your REFRESH TOKEN → Copy it → Paste it into .env.

### 🌐 Remote server (e.g. Raspberry Pi, Beelink, VPS)

You can’t directly open 127.0.0.1:8889 from your PC —
so you’ll use an SSH tunnel (safe and easy).

On your local PC, open a tunnel:

```bash
ssh -L 8889:localhost:8889 user@your-server-ip
```

Inside that SSH session on the server:

```bash
docker compose build --no-cache
docker compose run --rm -p 127.0.0.1:8889:8889 spotify2mqtt npm run auth
```

On your local PC, open:

```
http://127.0.0.1:8889
```

Log in → Copy the Refresh Token → Paste it into .env.

✅ Once you have the token, you can close the tunnel — you’ll never need to auth again
(unless you remove the app from your Spotify account).

---

## ▶️ Run the service

```bash
docker compose up -d
```

---

## 📡 MQTT Topics

| Topic                   | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| homelab/spotify/state   | Playback state, track/artist/album, progress, shuffle/repeat |
| homelab/spotify/context | Current context (playlist, album, artist, show, audiobook)   |
| homelab/spotify/queue   | Upcoming tracks/episodes                                     |
| homelab/spotify/device  | Current playback device                                      |
| homelab/spotify/image   | Album/show cover { base64, url }                             |

**Example payload (`/state`):**

```json
{
  "is_playing": true,
  "type": "track",
  "title": "Everything In Its Right Place",
  "artist": "Radiohead",
  "album": "Kid A",
  "progress_ms": 73456,
  "duration_ms": 257000,
  "shuffle_state": false,
  "repeat_state": "context",
  "timestamp": 1730000000000
}
```

---

## 🧠 Notes

- Redirect URI must match Spotify’s dashboard entry exactly (`http://127.0.0.1:8889/callback`)
- Don’t use `localhost` → use `127.0.0.1` instead
- After you get the token, you can remove the `ports:` line from `docker-compose.yml`
- Works fine behind SSH tunnels, Docker networks, or Nginx proxies

---

## 🧩 Troubleshooting

| Problem                            | Fix                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| address already in use             | Another service (like mediamtx) is using that port → change AUTH_PORT               |
| Browser can’t connect to 127.0.0.1 | Use SSH tunnel as shown above                                                       |
| Auth success but no data           | Check MQTT broker URL & creds, view logs with `docker compose logs -f spotify2mqtt` |
| Need to reauthorize                | Run the auth command again; new token replaces the old one                          |

---

## 💡 Example MQTT consumer (ESP/HA)

You can subscribe to `homelab/spotify/state` or `homelab/spotify/image`
and display data on an OLED, or use it in Home Assistant via MQTT sensor.

---

<p align="center">
Made with ❤️ by @brendlij
</p>
