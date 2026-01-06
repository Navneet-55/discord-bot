# Discord Bot MVP

Production-ready Discord bot with Core/Admin, Moderation, and Logging modules.

## Features

### Core/Admin Module
- `/ping` - Check bot latency
- `/health` - Check bot and database health
- `/config view` - View guild configuration
- `/config set` - Set log/modlog channels
- `/feature list` - List feature flags
- `/feature enable` - Enable a feature
- `/feature disable` - Disable a feature

### Moderation Module
- `/warn` - Warn a user
- `/kick` - Kick a user
- `/ban` - Ban a user (with optional message deletion)
- `/timeout` - Timeout a user (duration: 10s-28d)
- `/cases` - View moderation cases

### Logging Module
- Automatic logging of member joins/leaves (if enabled)
- Moderation action logging to mod log channel

## Setup

### Prerequisites
- Node.js 20+
- Docker and Docker Compose (for local Postgres)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot token, client ID, and database URL
   ```

4. Start PostgreSQL with Docker:
   ```bash
   docker-compose up -d
   ```

5. Generate Prisma client and run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

6. Deploy slash commands:
   ```bash
   npm run deploy-commands
   ```
   Note: If `DISCORD_GUILD_ID` is set in `.env`, commands deploy to that guild (faster). Otherwise, commands deploy globally (may take up to 1 hour to propagate).

7. Start the bot:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

## Environment Variables

- `DISCORD_TOKEN` - Your Discord bot token (required)
- `DISCORD_CLIENT_ID` - Your Discord application client ID (required)
- `DISCORD_GUILD_ID` - Optional: Guild ID for faster command deployment
- `DATABASE_URL` - PostgreSQL connection string (required)

## Feature Flags

- `CORE` - Always enabled (cannot be disabled)
- `MODERATION` - Controls moderation commands
- `LOGGING` - Controls join/leave event logging

## Database Schema

- `GuildConfig` - Per-guild configuration (log channels)
- `FeatureFlag` - Per-guild feature flags
- `ModCase` - Moderation case history

## Development

- Build: `npm run build`
- Lint: `npm run lint` (if configured)
- Format: `npm run format` (if configured)
- Prisma Studio: `npm run prisma:studio`

## Next Steps

- Add Redis for caching and rate limiting
- Implement job queue for async tasks
- Add sharding support for large-scale deployments
- Build admin dashboard for configuration management
