# Terminal Tic Tac Toe

A retro terminal-style Tic Tac Toe game built with React and Vite.

I made this for my kids for fun, and kept adding playful features like emoji game modes, a little ASCII puppy, and a boot-up sequence.

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
- Custom plus-sign cursor on desktop

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
