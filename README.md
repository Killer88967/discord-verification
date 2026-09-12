# Discord Verification

[![GitHub License](https://img.shields.io/github/license/Killer88967/discord-verification?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/forks)
[![GitHub Issues](https://img.shields.io/github/issues/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/pulls)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Required-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-12.4.1-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-Web-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-Bot-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)

A self-hosted Discord verification system built to provide more advanced verification than a simple button or CAPTCHA.

Discord Verification combines a **Discord bot**, **web-based verification flow**, **device/browser signals**, and a persistent database to help Discord servers verify users and detect potentially linked accounts.

> [!WARNING]
> This project is currently under development. APIs, database schemas, configuration, and behavior may change.

## Features

- Discord verification through generated, single-use verification sessions
- Web-based verification flow
- Automatic verified-role assignment
- Configurable verification settings per Discord server
- Expiring verification sessions
- Verification event logging
- Browser and device signal collection
- Hashed verification signals
- Detection infrastructure for potentially linked Discord accounts
- PostgreSQL-backed persistent storage
- Monorepo architecture with reusable internal packages
- Written primarily in TypeScript

## How It Works

1. A Discord user starts verification through the bot.
2. The bot creates a new verification session in the database.
3. A unique verification URL is generated for that session.
4. The user opens the verification website.
5. The verification service validates the session and processes verification signals.
6. When verification succeeds, the session is marked as verified.
7. The web service communicates with the bot's internal API.
8. The bot assigns the configured verified role to the Discord user.

Verification sessions have an expiration time and their lifecycle can be recorded through events such as:

- `SESSION_CREATED`
- `SESSION_OPENED`
- `VERIFIED`
- `REJECTED`
- `EXPIRED`

## Verification Signals

The system currently has support for verification signals including:

- Device token
- User agent
- Timezone
- Language
- Platform
- Screen information
- Hardware information
- Network information

Signal values are designed to be stored as hashes rather than directly storing their original values.

These signals can be used by the verification system to identify relationships between verification attempts and help detect potentially linked accounts.

## Project Structure

```text
discord-verification/
├── apps/
│ ├── bot/
│ │ ├── src/         # Discord bot source
│ │ └── .env.example # Bot environment template
│ │
│ └── web/
│ ├── src/           # Next.js verification website
│ └── .env.example   # Web environment template
│
├── packages/
│ ├── database/      # Prisma models and database utilities
│ ├── security/      # Security and verification utilities
│ ├── shared/        # Shared application utilities
│ └── types/         # Shared TypeScript types
│
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

## Tech Stack

| Technology   | Usage                                  |
| ------------ | -------------------------------------- |
| TypeScript   | Primary language                       |
| Discord.js   | Discord bot                            |
| Next.js      | Verification website and API           |
| React        | Web interface                          |
| Tailwind CSS | Web styling                            |
| Prisma       | Database ORM/tooling                   |
| PostgreSQL   | Persistent database                    |
| pnpm         | Package manager and monorepo workspace |

## Requirements

Before running the project, you will need:

- Node.js
- pnpm `12.3.4`
- PostgreSQL
- A Discord application and bot
- OpenSSL or another method of generating secure secrets

## Installation

Clone the repository:

```bash
git clone https://github.com/Killer88967/discord-verification.git
cd discord-verification
```

Install dependencies:

```bash
pnpm install
```

## Environment Setup

Environment templates are included for both applications.

Create the bot environment file:

```bash
cp apps/bot/.env.example apps/bot/.env
```

Create the web environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

Then replace the placeholder values inside each file.

### Bot Environment

`apps/bot/.env`

```env
DISCORD_TOKEN=REPLACE
DISCORD_CLIENT_ID=REPLACE
VERIFY_URL=http://localhost:3000
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0"

# Internal

INTERNAL_API_SECRET=REPLACE
INTERNAL_API_PORT=3100
```

### Web Environment

`apps/web/.env`

```env
DATABASE_URL="postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&connection_limit=10&connect_timeout=0&max_idle_connection_lifetime=0&pool_timeout=0&socket_timeout=0"

# Internal

INTERNAL_API_SECRET=REPLACE
BOT_INTERNAL_URL=http://127.0.0.1:3100

# Security

FINGERPRINT_HMAC_SECRET=REPLACE
```

### Environment Variables

| Variable                  | Application | Description                                                 |
| ------------------------- | ----------- | ----------------------------------------------------------- |
| `DISCORD_TOKEN`           | Bot         | Discord bot token                                           |
| `DISCORD_CLIENT_ID`       | Bot         | Discord application/client ID                               |
| `VERIFY_URL`              | Bot         | Base URL of the verification website                        |
| `DATABASE_URL`            | Bot & Web   | PostgreSQL connection string                                |
| `INTERNAL_API_SECRET`     | Bot & Web   | Shared secret used for internal communication               |
| `INTERNAL_API_PORT`       | Bot         | Port used by the bot's internal API                         |
| `BOT_INTERNAL_URL`        | Web         | URL used by the web application to communicate with the bot |
| `FINGERPRINT_HMAC_SECRET` | Web         | Secret used when hashing verification fingerprint data      |

> [!IMPORTANT]
> `INTERNAL_API_SECRET` must contain the **same value** in both the bot and web environment files.

Generate a secure secret with:

```bash
pnpm gen:secret
```

This currently uses:

```bash
openssl rand -hex 32
```

You should generate separate secure values where appropriate rather than reusing a secret for unrelated purposes.

> [!CAUTION]
> Never commit real Discord tokens, database credentials, internal API secrets, fingerprint secrets, or production environment files to Git.

## Database Setup

The database package uses Prisma with PostgreSQL.

Make sure `DATABASE_URL` points to a running PostgreSQL database before continuing.

Generate the Prisma client:

```bash
pnpm db:gen
```

Run a development migration:

```bash
pnpm db:mig <migration-name>
```

For example:

```bash
pnpm db:mig initial
```

The database currently stores information including:

- Discord guilds
- Guild verification configuration
- Verification sessions
- Verified users
- Verification events
- Verification signals
- Browser devices
- Potential account links

## Development

Run all development applications in parallel:

```bash
pnpm dev
```

The root workspace runs each package's `dev` command through pnpm.

You can also run individual applications.

### Bot

```bash
pnpm --filter @verification/bot dev
```

### Web

```bash
pnpm --filter @verification/web dev
```

By default, the Next.js application runs at:

```text
http://localhost:3000
```

The bot's internal API defaults to:

```text
http://127.0.0.1:3100
```

unless `INTERNAL_API_PORT` or `BOT_INTERNAL_URL` is configured differently.

## Building

Build the entire workspace:

```bash
pnpm build
```

Run TypeScript checks across the workspace:

```bash
pnpm typecheck
```

## Database Models

The verification database is centered around several core models.

### `Guild`

Represents a Discord server using the verification system.

### `GuildConfig`

Stores server-specific settings such as:

- Verified role
- Verification channel
- Log channel
- Whether verification is enabled

### `VerificationSession`

Represents an individual verification attempt and contains its status, user, server, expiration time, events, and collected signals.

Possible states are:

```text
PENDING
VERIFIED
REJECTED
EXPIRED
```

### `VerifiedUser`

Tracks users that have successfully completed verification in a server.

### `VerificationEvent`

Records events that occur during a verification session.

### `VerificationSignal`

Stores hashed signals associated with a verification attempt.

### `BrowserDevice`

Represents a recognized browser/device token using its hashed value.

### `AccountLink`

Represents a detected relationship between two Discord user IDs.

Links can currently have confidence levels of:

```text
LOW
MEDIUM
HIGH
```

## Security

The project is designed so sensitive verification values can be processed as hashes instead of being stored directly.

Several secrets are used internally, including:

- Discord bot token
- Internal bot/web API secret
- Fingerprint HMAC secret
- Database credentials

Production deployments should always use strong, independently generated secrets and HTTPS.

Never expose `INTERNAL_API_SECRET`, `FINGERPRINT_HMAC_SECRET`, or other server-side credentials to browser-side JavaScript.

## Monorepo

This repository uses pnpm workspaces.

The primary applications are:

```text
@verification/bot
@verification/web
```

Internal packages are shared between applications using workspace dependencies such as:

```json
{
  "@verification/database": "workspace:*"
}
```

This keeps database, security, shared logic, and types separated from application-specific code.

## Contributing

Contributions, bug reports, and suggestions are welcome.

If contributing code:

1. Fork the repository.
2. Create a branch for your changes.
3. Install dependencies with `pnpm install`.
4. Copy and configure the required `.env.example` files.
5. Make your changes.
6. Run the build and type checks.
7. Submit a pull request.

## License

Discord Verification Bot is licensed under the
[Apache License 2.0](LICENSE).

See [NOTICE](NOTICE) for attribution information.

## Author

Created by [Killer88967](https://github.com/Killer88967).
