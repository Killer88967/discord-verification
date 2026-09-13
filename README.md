# Discord Verification

[![CI](https://img.shields.io/github/actions/workflow/status/Killer88967/discord-verification/ci.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/Killer88967/discord-verification/actions/workflows/ci.yml)
[![GitHub License](https://img.shields.io/github/license/Killer88967/discord-verification?style=for-the-badge)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/forks)
[![GitHub Issues](https://img.shields.io/github/issues/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/pulls)
[![GitHub Last Commit](https://img.shields.io/github/last-commit/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification/commits/main)
[![GitHub Repo Size](https://img.shields.io/github/repo-size/Killer88967/discord-verification?style=for-the-badge)](https://github.com/Killer88967/discord-verification)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-12.4.1-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Discord.js](https://img.shields.io/badge/discord.js-14.27.0-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.10.0-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)

A self-hosted Discord verification system built to provide more advanced verification than a simple button or CAPTCHA.

Discord Verification combines a **Discord bot**, **web-based verification flow**, **browser/device signals**, **risk analysis**, and a persistent database to help Discord servers verify users and identify potentially related accounts.

> [!WARNING]
> This project is currently under active development. APIs, database schemas, configuration, and behavior may change.

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Current Status](#current-status)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Discord Commands](#discord-commands)
- [Bot Permissions](#bot-permissions)
- [Server Configuration](#server-configuration)
- [Risk Detection](#risk-detection)
- [Privacy and Data Handling](#privacy-and-data-handling)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Development](#development)
- [Building](#building)
- [Database Models](#database-models)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Project Resources](#project-resources)
- [Contributing](#contributing)
- [License](#license)

## Quick Start

Clone the repository:

```bash
git clone https://github.com/Killer88967/discord-verification.git
cd discord-verification
```

Install dependencies:

```bash
pnpm install
```

Create the application environment files:

```bash
cp apps/bot/.env.example apps/bot/.env
cp apps/web/.env.example apps/web/.env
```

Configure the required environment variables, then start the development environment:

```bash
pnpm dev
```

Once the bot is online:

1. Invite the bot to your Discord server.
2. Run `/setup`.
3. Choose the verification channel.
4. Choose the role users should receive after verification.
5. Optionally configure security rules with `/config security`.
6. Users can begin verification through the message posted by the bot.

## Features

- Generated, single-use verification sessions
- Web-based Discord verification flow
- Automatic verified-role assignment
- Per-server verification configuration
- Expiring verification sessions
- Verification event history
- Browser and device signal collection
- HMAC/hash-based signal storage
- Potential linked-account detection
- Relationship confidence levels
- Relationship match scoring
- Minimum Discord account-age enforcement
- Configurable server risk thresholds
- Automatic reject, kick, or ban enforcement
- Moderator investigation tools
- PostgreSQL-backed persistent storage
- Reusable internal monorepo packages
- Self-hosted infrastructure

## Current Status

The core verification pipeline is functional.

Currently implemented:

- Verification session creation
- Web verification
- Discord role assignment
- Server setup through `/setup`
- Security configuration through `/config security`
- Moderator investigations through `/check`
- Browser/device signal processing
- Account relationship detection
- Risk scoring and threshold enforcement
- Verification history and event tracking

The project remains under development and should not yet be considered API-stable.

## How It Works

1. A server administrator configures verification using `/setup`.
2. The bot creates a verification message with a **Verify** button.
3. A user starts verification through Discord.
4. The bot creates an expiring verification session.
5. A unique verification URL is generated for that session.
6. The user opens the Next.js verification application.
7. The web application validates the session and processes verification signals.
8. The risk system evaluates available account and browser information.
9. The verification session is accepted or rejected.
10. The web application securely communicates the result to the bot.
11. The bot applies the configured result, such as:
    - assigning the verified role,
    - rejecting verification,
    - kicking the member,
    - or banning the member.

Verification session events can include:

- `SESSION_CREATED`
- `SESSION_OPENED`
- `VERIFIED`
- `REJECTED`
- `EXPIRED`

## Architecture

```mermaid
flowchart TD
    U[Discord User]

    B[Discord Bot<br/>discord.js]
    W[Verification Web App<br/>Next.js]
    DB[(PostgreSQL<br/>Prisma)]
    S[Security / Risk Engine]
    API[Bot Internal API]
    D[Discord Server]

    U -->|Starts Verification| B
    B -->|Creates Session| DB
    B -->|Provides Verification URL| U
    U -->|Opens Verification Link| W

    W <-->|Sessions / Events / Signals| DB
    W -->|Verification Signals| S
    S <-->|Risk / Relationship Data| DB

    W -->|Verification Result| API
    API --> B

    B -->|Verified Role| D
    B -->|Reject / Kick / Ban| D
```

The repository separates application-specific code from reusable database, security, shared, and type packages.

## Discord Commands

### `/setup`

Configures verification for a Discord server.

Requires **Manage Server**.

Options:

| Option    | Description                                                |
| --------- | ---------------------------------------------------------- |
| `channel` | Text channel where the verification message will be posted |
| `role`    | Role granted after successful verification                 |

The bot validates that:

- The selected channel is a text channel
- The selected role can be assigned by the bot
- The role is below the bot's highest role
- The bot has `Manage Roles`
- The bot can view the verification channel
- The bot can send messages
- The bot can embed links

After setup, the bot posts a verification message containing a **Verify** button.

### `/verify`

Creates a verification link for the current Discord server.

This can be used to manually begin a verification session without relying on the persistent verification message.

### `/config security`

Views or modifies verification security settings.

Requires **Manage Server**.

| Option                | Range / Values                  | Description                                     |
| --------------------- | ------------------------------- | ----------------------------------------------- |
| `minimum-account-age` | `0-3650`                        | Minimum Discord account age in days             |
| `risk-threshold`      | `0-100`                         | Risk score required before enforcement          |
| `risk-action`         | `NONE`, `REJECT`, `KICK`, `BAN` | Action taken when the risk threshold is reached |

Running `/config security` without any options displays the current policy.

### `/check`

Investigates a user's verification history and detected account relationships.

Requires **Moderate Members**.

The result can include:

- Verification status
- Successful verification count
- Rejected attempt count
- Latest verification session
- First verification time
- Last verification time
- Latest verification attempt
- Linked Discord accounts
- Relationship reason
- Relationship confidence
- Match score
- Matching signals
- First-seen and last-seen timestamps
- Whether linked accounts are currently in the server

The command response is ephemeral.

## Bot Permissions

The bot requires appropriate Discord permissions depending on the enabled features.

### Required for Verification

- View Channels
- Send Messages
- Embed Links
- Manage Roles

The bot's highest role must be positioned **above** the configured verified role.

### Required for Enforcement

Depending on the configured risk action, the bot may also require:

- Kick Members
- Ban Members

> [!IMPORTANT]
> Discord's role hierarchy still applies even when the bot has the correct permission.

## Server Configuration

Each Discord server maintains its own verification configuration.

Basic settings include:

- Verification enabled state
- Verification channel
- Verified role
- Logging configuration

Security policies include:

- Minimum Discord account age
- Risk threshold
- Risk action

### Risk Actions

| Action   | Behavior                             |
| -------- | ------------------------------------ |
| `NONE`   | Do not perform automatic enforcement |
| `REJECT` | Reject the verification attempt      |
| `KICK`   | Remove the user from the server      |
| `BAN`    | Ban the user from the server         |

This allows individual servers to decide how aggressively suspicious verification attempts should be handled.

## Risk Detection

Discord Verification includes a risk-analysis layer designed to identify suspicious verification activity and potential relationships between accounts.

Signals currently supported include:

- Device token
- User agent
- Timezone
- Language
- Platform
- Screen information
- Hardware information
- Network information

Relationships may be detected through:

- Direct device-token matches
- Multiple matching browser/device signals
- Historical verification information

Detected relationships may include:

- Relationship reason
- Matching signals
- Match score
- Confidence
- First-seen timestamp
- Last-seen timestamp

Confidence levels include:

```text
LOW
MEDIUM
HIGH
```

> [!IMPORTANT]
> Account relationships are indicators, not proof that multiple Discord accounts belong to the same person.
>
> Fingerprinting and browser-based detection are inherently probabilistic and may produce false positives or false negatives.

Moderators should consider the available evidence before taking manual action.

## Privacy and Data Handling

Discord Verification processes browser and device information to evaluate verification activity and detect potential account relationships.

Verification signals are designed to be stored as **hashed/HMAC-derived values** rather than directly storing their original values.

Processed signals can include:

- Device identifiers generated by the verification system
- Browser user agent
- Timezone
- Language
- Platform
- Screen information
- Hardware information
- Network-related information

Sensitive hashing operations use server-side secrets such as:

```text
FINGERPRINT_HMAC_SECRET
```

These secrets must never be exposed to browser-side JavaScript or committed to source control.

### Security Limitations

Hashing verification signals reduces direct exposure of their original values, but hashed data should still be treated as sensitive.

Operators should not assume that hashing alone makes collected information anonymous.

Browser and device fingerprinting may also be affected by:

- Browser privacy protections
- Extensions
- VPNs and proxies
- Device configuration changes
- Shared devices
- Virtual machines
- Automated clients
- Deliberate attempts to evade detection

### Self-Hosting Responsibility

Discord Verification is self-hosted.

Instance operators are responsible for:

- Protecting stored verification data
- Restricting database access
- Securing application secrets
- Configuring appropriate data retention
- Informing users about data collection when required
- Following applicable privacy and data-protection laws

## Project Structure

```text
discord-verification/
├── .github/                 # GitHub configuration and templates
│
├── apps/
│   ├── bot/                 # Discord bot
│   │   ├── src/
│   │   └── .env.example
│   │
│   └── web/                 # Next.js verification application
│       ├── src/
│       └── .env.example
│
├── packages/
│   ├── database/            # Prisma models and database utilities
│   ├── security/            # Risk and security logic
│   ├── shared/              # Shared application utilities
│   └── types/               # Shared TypeScript types
│
├── CONTRIBUTING.md
├── SECURITY.md
├── SUPPORT.md
├── LICENSE
├── NOTICE
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

## Tech Stack

| Technology   | Usage                                      |
| ------------ | ------------------------------------------ |
| TypeScript   | Primary language                           |
| Discord.js   | Discord bot                                |
| Next.js      | Verification website and API               |
| React        | Web interface                              |
| Tailwind CSS | Web styling                                |
| Prisma       | Database tooling                           |
| PostgreSQL   | Persistent storage                         |
| pnpm         | Package management and monorepo workspaces |

## Requirements

Before running the project, you will need:

- Node.js
- pnpm `12.4.1`
- A Discord application and bot
- OpenSSL or another method of generating secure secrets

## Environment Setup

Environment templates are included for the bot and web application.

Create local copies:

```bash
cp apps/bot/.env.example apps/bot/.env
cp apps/web/.env.example apps/web/.env
```

Then replace the placeholder values.

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

| Variable                  | Application | Description                                   |
| ------------------------- | ----------- | --------------------------------------------- |
| `DISCORD_TOKEN`           | Bot         | Discord bot token                             |
| `DISCORD_CLIENT_ID`       | Bot         | Discord application/client ID                 |
| `VERIFY_URL`              | Bot         | Base URL of the verification website          |
| `DATABASE_URL`            | Bot & Web   | PostgreSQL connection string                  |
| `INTERNAL_API_SECRET`     | Bot & Web   | Shared secret used for internal communication |
| `INTERNAL_API_PORT`       | Bot         | Port exposed by the bot's internal API        |
| `BOT_INTERNAL_URL`        | Web         | Internal URL used to communicate with the bot |
| `FINGERPRINT_HMAC_SECRET` | Web         | Secret used when hashing fingerprint signals  |

> [!IMPORTANT]
> `INTERNAL_API_SECRET` must be identical between the bot and web application.

Generate a secure random secret with:

```bash
pnpm gen:secret
```

which currently uses:

```bash
openssl rand -hex 32
```

Generate separate secrets for unrelated purposes.

> [!CAUTION]
> Never commit real Discord tokens, database credentials, internal API secrets, fingerprint secrets, or production environment files.

## Database Setup

The database package uses Prisma with PostgreSQL.

Start the local Prisma development database:

```bash
pnpm db:dev
```

Generate the Prisma client:

```bash
pnpm db:gen
```

Run a development migration:

```bash
pnpm db:mig <migration-name>
```

Example:

```bash
pnpm db:mig initial
```

The database stores information including:

- Discord guilds
- Guild verification configuration
- Security policies
- Verification sessions
- Verified users
- Verification events
- Verification signals
- Browser/device information
- Potential account relationships

## Development

Start the complete development environment:

```bash
pnpm dev
```

The root development command starts the Prisma development database and launches the bot and web application once the database is available.

### Run Individual Applications

Web application:

```bash
pnpm dev:web
```

Discord bot:

```bash
pnpm dev:bot
```

Database:

```bash
pnpm db:dev
```

By default, the web application runs at:

```text
http://localhost:3000
```

The bot's internal API defaults to:

```text
http://127.0.0.1:3100
```

## Building

Build the entire workspace:

```bash
pnpm build
```

Build everything except the web application:

```bash
pnpm build:nw
```

Run TypeScript checks:

```bash
pnpm typecheck
```

## Database Models

The database is centered around several verification-related models.

### `Guild`

Represents a Discord server using the verification system.

### `GuildConfig`

Stores per-server verification configuration such as:

- Verified role
- Verification channel
- Logging configuration
- Enabled state

### `VerificationSession`

Represents an individual verification attempt.

Possible states include:

```text
PENDING
VERIFIED
REJECTED
EXPIRED
```

A session can contain:

- User ID
- Guild ID
- Expiration information
- Verification events
- Verification signals
- Completion state

### `VerifiedUser`

Tracks users that have successfully completed verification.

### `VerificationEvent`

Records events that occur throughout the verification lifecycle.

### `VerificationSignal`

Stores hashed signals associated with a verification attempt.

### `BrowserDevice`

Represents recognized browser/device identifiers using hashed values.

### `AccountLink`

Represents a detected relationship between Discord accounts.

Relationships may include:

- Reason
- Confidence
- Match score
- Matching signals
- First-seen time
- Last-seen time

## Production Deployment

Development defaults are not intended to represent a complete production configuration.

Recommended production practices include:

- Use HTTPS
- Use a production PostgreSQL database
- Generate strong unique secrets
- Restrict database access
- Restrict access to the bot's internal API
- Avoid exposing the internal API publicly
- Place public services behind an appropriate reverse proxy
- Run services under dedicated system users or containers
- Keep dependencies and operating systems updated
- Configure database backups
- Monitor application logs
- Never commit production environment files

The bot and web application must be able to communicate securely through the internal API.

## Troubleshooting

### Slash Commands Do Not Appear

Check that:

- `DISCORD_CLIENT_ID` is correct
- The bot was invited with application command permissions
- The bot successfully registered its commands
- The bot is logged into the expected Discord application

### The Bot Cannot Assign the Verified Role

Make sure:

- The bot has `Manage Roles`
- The bot's highest role is above the verified role
- The verified role is not managed by another integration
- The configured role still exists

### Verification Message Cannot Be Created

Make sure the bot has the following permissions in the verification channel:

- View Channel
- Send Messages
- Embed Links

### Web Application Cannot Reach the Bot

Check:

- `BOT_INTERNAL_URL`
- `INTERNAL_API_PORT`
- `INTERNAL_API_SECRET`
- Firewall or container networking rules

The bot and web application must use the same `INTERNAL_API_SECRET`.

### Database Connection Fails

Check:

- `DATABASE_URL`
- Whether the Prisma development database is running
- The configured database port
- PostgreSQL availability
- Firewall or container networking configuration

### Verification Links Open the Wrong Address

Check `VERIFY_URL` in the bot environment.

For local development it normally points to:

```env
VERIFY_URL=http://localhost:3000
```

For production it should point to the public HTTPS verification domain.

## Roadmap

Discord Verification is actively being developed.

### Implemented

- [x] Verification sessions
- [x] Single-use verification links
- [x] Web-based verification
- [x] Automatic verified-role assignment
- [x] Per-server setup
- [x] Browser/device signal collection
- [x] Hashed verification signals
- [x] Verification event history
- [x] Linked-account detection
- [x] Relationship confidence
- [x] Relationship match scoring
- [x] Moderator investigation command
- [x] Minimum account-age policies
- [x] Configurable risk thresholds
- [x] Reject enforcement
- [x] Kick enforcement
- [x] Ban enforcement

<!--
### Planned

- [ ] Expanded server configuration
- [ ] Improved moderation tooling
- [ ] Additional risk signals
- [ ] Improved audit logs
- [ ] Administration dashboard
- [ ] Deployment documentation
-->

The roadmap may change as the project develops.

## Screenshots

Screenshots of the Discord and web verification flow will be added as the user interface continues to develop.

<!--
Suggested screenshots:

- Verification message
- /setup result
- Web verification page
- Successful verification page
- /config security output
- /check investigation output

Example:

![Verification Message](docs/images/verification-message.png)
-->

## Project Resources

- [Contributing Guide](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [License](LICENSE)
- [Notice](NOTICE)

## Contributing

Contributions, bug reports, and suggestions are welcome.

Before contributing, read [CONTRIBUTING.md](CONTRIBUTING.md).

A typical development workflow is:

1. Fork the repository.
2. Create a branch.
3. Install dependencies with `pnpm install`.
4. Configure the `.env.example` files.
5. Start development with `pnpm dev`.
6. Make your changes.
7. Run the build and type checks.
8. Submit a pull request.

Security vulnerabilities should be reported according to [SECURITY.md](SECURITY.md) rather than through a public issue.

## License

Discord Verification is licensed under the [Apache License 2.0](LICENSE).

See [NOTICE](NOTICE) for attribution information.

## Author

Created by [Killer88967](https://github.com/Killer88967).
