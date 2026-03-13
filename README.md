<p align="center">
  <img src="./public/favicon-terminal.svg" alt="Terminal Tic Tac Toe logo" width="88" />
</p>

<h1 align="center">Terminal Tic Tac Toe</h1>

<p align="center">
  <a href="https://ttt2026.netlify.app">https://ttt2026.netlify.app</a>
</p>

[![Netlify Status](https://api.netlify.com/api/v1/badges/ecbe811e-30a0-464b-881a-e5f53edb4e1d/deploy-status)](https://app.netlify.com/projects/ttt2026/deploys)

A retro terminal-style Tic Tac Toe game built with React and Vite.

I made this for my kids for fun, and kept adding playful features like emoji game modes, a little ASCII puppy, and a boot-up sequence.

## Screenshots

![Gameplay](https://github.com/user-attachments/assets/b8e140b7-bb8d-4bea-9704-68270d37d2e3)
![Settings](https://github.com/user-attachments/assets/ae8759a1-e20f-49b8-bbbf-6595a125413e)

## Features

- Classic Tic Tac Toe gameplay
- Click-to-edit player names
- LocalStorage persistence for names, wins, draws, last winner, theme, and piece mode
- Multiple color themes: red, orange, yellow, green, blue, purple, pink, white
- Multiple piece modes: classic, cat/dog, robot/dinosaur, cupcake/unicorn, ghost/alien
- Startup preload sequence with `[000]` to `[100]` counter
- Separate audio toggles for `BGM` and `FX`
- QR code link tab for opening the game on a phone
- Live telemetry panel (mouse coordinates and date/time)
- Persistent global telemetry stats powered by Upstash Redis + Netlify Functions
- Custom plus-sign cursor on desktop

## Todo

- [ ] Multiplayer between desktop and phone (WebRTC DataChannel?)

## Tech Stack

- React
- Vite
- CSS
- qrcode.react

## Run Locally

```bash
npm install
npm run dev
```

Note: the Vite dev server does not serve Netlify Functions by itself, so persistent telemetry will show offline locally unless you run through Netlify dev or deploy the site.

Build for production:

```bash
npm run build
```

## Phone + Desktop Play

Run with host enabled:

```bash
npm run dev -- --host
```

Then use your LAN URL in the `Link` tab to generate a QR code for a second device.

⚠️ Multiplayer is coming soon.

## Persistent Telemetry Setup

This app uses one shared Upstash Redis database and stores Tic Tac Toe stats under the Redis hash key `game:tic-tac-toe:telemetry:global`.

Required Upstash fields:

```txt
games_played
wins_X
wins_O
draws
last_result
last_played_at
```

### 1. Create Upstash Redis

- Create a single Redis database in Upstash
- Copy these values from the database details page:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

### 2. Add Netlify environment variables

In your Netlify site, add:

```txt
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Then redeploy the site.

### 3. How telemetry works

- `GET /.netlify/functions/telemetry?game=tic-tac-toe` reads the shared global stats
- `POST /.netlify/functions/telemetry` updates the shared stats when a round ends
- Completed games increment `games_played` and one of `wins_X`, `wins_O`, or `draws`
- `INIT NEW ROUND` and local score resets do not change the global Redis counters
