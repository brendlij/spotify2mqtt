<p align="center">
<img src="https://img.shields.io/badge/Node.js-20%2B-brightgreen" alt="Node.js 20+ Required">
<img src="https://img.shields.io/badge/MQTT-Publisher-blue" alt="MQTT Publisher">
<img src="https://img.shields.io/badge/Docker-Ready-informational" alt="Docker Ready">
</p>
Fetches your currently playing Spotify track and publishes the data as a clean JSON payload via MQTT. This lightweight bridge is perfect for integrating real-time playback information into Home Assistant, custom ESP displays, or any IoT project requiring quick state updates.

✨ Features

Real-Time Polling: Pulls the current Spotify playback status at a user-defined interval (default: $2,000$ms).

MQTT Publisher: Publishes a detailed JSON object containing title, artist, progress_ms, and playback state.

Security Support: Works with both secured (username/password) and open MQTT brokers.

Dockerized: Runs locally and is extremely lightweight, using an Alpine base image.

Simple Authentication: Includes an easy, one-time browser-based flow to obtain the necessary refresh token.

🧱 Setup & Configuration

This project is designed to be deployed quickly using Docker Compose.

1. Clone the Repository

git clone [https://github.com/yourusername/spotify2mqtt.git](https://github.com/yourusername/spotify2mqtt.git)
cd spotify2mqtt

2. Create Your Spotify Application

Before proceeding, you need to register this service with Spotify to get the necessary credentials.

Go to the Spotify Developer Dashboard.

Click Create App and set the name (e.g., spotify2mqtt).

In the app settings, click Edit Settings and add the following Redirect URI:

[http://127.0.0.1:8888/callback](http://127.0.0.1:8888/callback)

Tick the ✅ Web API box, accept the Developer Terms, and save.

Copy your Client ID and Client Secret.

3. Configure the Environment

Copy the example environment file and update it with your credentials and broker details.

cp .env.example .env

Now, edit the newly created .env file:

# --- SPOTIFY SETTINGS ---

SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN= # LEAVE EMPTY FOR NOW (Step 4)

# --- MQTT SETTINGS ---

MQTT_URL=mqtt://192.168.1.10:1883 # e.g., mqtt://broker-ip:port
MQTT_USER=optional_user # Optional: remove if broker is unsecured

MQTT_PASS=optional_pass # Optional: remove if broker is unsecured
MQTT_TOPIC=homelab/spotify/now # The topic where data will be published
POLL_MS=2000 # Polling interval in milliseconds (2s)

4. Authorize Spotify (One-Time)

You only need to do this step once to get your permanent Refresh Token.

Run the interactive authorization container:

docker compose run --rm -p 8888:8888 spotify2mqtt npm run auth

The command will print a local link.

Open the link in your browser and log in to Spotify.

The browser will redirect and display a long Refresh Token.

Copy this token and paste it into your .env file: SPOTIFY_REFRESH_TOKEN=your_token_here

5. Build and Start the Service

Once the .env file is complete, build the image and start the service in detached mode.

docker compose build
docker compose up -d

The service will now run in the background, automatically refreshing the access token, fetching playback data, and publishing it to your configured MQTT topic every $2$ seconds.

🧩 Example MQTT Payload

The service publishes a single JSON object.

{
"is_playing": true,
"title": "Everything In Its Right Place",
"artist": "Radiohead",
"album": "Kid A",
"progress_ms": 73456,
"duration_ms": 257000
}

🧠 Tips & Debugging

- Logs: To monitor the service and check for errors, use the following command:

  ```sh
  docker compose logs -f spotify2mqtt
  ```

- Ports: After successfully completing the authorization (Step 4), you can safely remove the ports mapping (-p 8888:8888) from your docker-compose.yml file, as it is no longer needed.

💥 Example Use Cases

- Home Assistant: Create a media player card or dashboard widget showing current track information.
- ESP Displays: Use an ESP32/ESP8266 and an OLED screen to create a dedicated, real-time Spotify display.
- Ambient Lighting: Trigger color changes or effects based on the state (is_playing).

⚙️ Tech Stack

- Platform: Node.js $20+$
- API: Spotify Web API
- Messaging: MQTT (via mqtt package)
- Deployment: Docker Compose (Alpine base)

Made with ❤️ by [YourName]
spotify2mqtt

<p align="center">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Node.js-20%2B-brightgreen" alt="Node.js 20+ Required">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/MQTT-Publisher-blue" alt="MQTT Publisher">
<img src="https://www.google.com/search?q=https://img.shields.io/badge/Docker-Ready-informational" alt="Docker Ready">
</p>

Fetches your currently playing Spotify track and publishes the data as a clean JSON payload via MQTT. This lightweight bridge is perfect for integrating real-time playback information into Home Assistant, custom ESP displays, or any IoT project requiring quick state updates.

✨ Features

Real-Time Polling: Pulls the current Spotify playback status at a user-defined interval (default: $2,000$ms).

MQTT Publisher: Publishes a detailed JSON object containing title, artist, progress_ms, and playback state.

Security Support: Works with both secured (username/password) and open MQTT brokers.

Dockerized: Runs locally and is extremely lightweight, using an Alpine base image.

Simple Authentication: Includes an easy, one-time browser-based flow to obtain the necessary refresh token.

🧱 Setup & Configuration

This project is designed to be deployed quickly using Docker Compose.

1. Clone the Repository

git clone [https://github.com/yourusername/spotify2mqtt.git](https://github.com/yourusername/spotify2mqtt.git)
cd spotify2mqtt

2. Create Your Spotify Application

Before proceeding, you need to register this service with Spotify to get the necessary credentials.

Go to the Spotify Developer Dashboard.

Click Create App and set the name (e.g., spotify2mqtt).

In the app settings, click Edit Settings and add the following Redirect URI:

[http://127.0.0.1:8888/callback](http://127.0.0.1:8888/callback)

Tick the ✅ Web API box, accept the Developer Terms, and save.

Copy your Client ID and Client Secret.

3. Configure the Environment

Copy the example environment file and update it with your credentials and broker details.

cp .env.example .env

Now, edit the newly created .env file:

# --- SPOTIFY SETTINGS ---

SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN= # LEAVE EMPTY FOR NOW (Step 4)

# --- MQTT SETTINGS ---

MQTT_URL=mqtt://192.168.1.10:1883 # e.g., mqtt://broker-ip:port
MQTT_USER=optional_user # Optional: remove if broker is unsecured
MQTT_PASS=optional_pass # Optional: remove if broker is unsecured
MQTT_TOPIC=homelab/spotify/now # The topic where data will be published
POLL_MS=2000 # Polling interval in milliseconds (2s)

4. Authorize Spotify (One-Time)

You only need to do this step once to get your permanent Refresh Token.

Run the interactive authorization container:

docker compose run --rm -p 8888:8888 spotify2mqtt npm run auth

The command will print a local link.

Open the link in your browser and log in to Spotify.

The browser will redirect and display a long Refresh Token.

Copy this token and paste it into your .env file: SPOTIFY_REFRESH_TOKEN=your_token_here

5. Build and Start the Service

Once the .env file is complete, build the image and start the service in detached mode.

docker compose build
docker compose up -d

The service will now run in the background, automatically refreshing the access token, fetching playback data, and publishing it to your configured MQTT topic every $2$ seconds.

🧩 Example MQTT Payload

The service publishes a single JSON object.

{
"is_playing": true,
"title": "Everything In Its Right Place",
"artist": "Radiohead",
"album": "Kid A",
"progress_ms": 73456,
"duration_ms": 257000
}

🧠 Tips & Debugging

Logs: To monitor the service and check for errors, use the following command:

docker compose logs -f spotify2mqtt

Ports: After successfully completing the authorization (Step 4), you can safely remove the ports mapping (-p 8888:8888) from your docker-compose.yml file, as it is no longer needed.

💥 Example Use Cases

Home Assistant: Create a media player card or dashboard widget showing current track information.

ESP Displays: Use an ESP32/ESP8266 and an OLED screen to create a dedicated, real-time Spotify display.

Ambient Lighting: Trigger color changes or effects based on the state (is_playing).

⚙️ Tech Stack

Platform: Node.js $20+$

API: Spotify Web API

Messaging: MQTT (via mqtt package)

Deployment: Docker Compose (Alpine base)

Made with ❤️ by [YourName]
