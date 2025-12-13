# MCTelementryBot

A Discord bot for monitoring Minecraft servers via MCTelemetry endpoints. It provides a `/mcstatus` slash command with a refresh button to view TPS, MSPT, and player counts for configured servers.

## Features
- `/mcstatus` shows a compact embed of configured servers.
- Refresh button updates the same message without spamming channels.
- Telemetry responses cached for 10 seconds to reduce load.
- Administrator (or configured role) required to run the command or refresh.

## Prerequisites
- Node.js 20+
- npm
- A Discord application and bot token

## Setup
1. Create a Discord application and bot in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Enable the **applications.commands** scope and invite the bot to your development server with the **bot** scope (no privileged intents needed).
3. Clone this repository and install dependencies:
   ```bash
   npm install
   ```
4. Create a `servers.json` file in the project root (or `./config/servers.json`):
   ```json
   [
     { "id": "aof", "name": "Age Of Fate", "telemetryUrl": "http://188.40.107.48:28765/telemetry" },
     { "id": "atm10", "name": "ATM10", "telemetryUrl": "http://188.40.107.48:28766/telemetry" }
   ]
   ```
5. Set environment variables (use a `.env` file for convenience):
   ```bash
   DISCORD_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_application_id
   DISCORD_GUILD_ID=your_dev_guild_id
   # Optional: allow a specific role to use /mcstatus
   ADMIN_ROLE_ID=role_id
   ```

## Scripts
- `npm run dev` – Start the bot in watch mode via `tsx`.
- `npm run build` – Compile TypeScript to `dist/`.
- `npm start` – Run the compiled bot.
- `npm run lint` – Lint TypeScript files.
- `npm run format` – Format with Prettier.

## Running the bot (development)
```bash
npm run dev
```
The bot registers guild-scoped commands on startup for faster iteration.

## Build and run (production)
```bash
npm run build
npm start
```

## Notes
- Telemetry fetches timeout after 2 seconds; failed servers show as `OFFLINE/NO DATA` while errors are logged with timestamps.
- Cached telemetry is reused for 10 seconds unless the refresh button is clicked.
