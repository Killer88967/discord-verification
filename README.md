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

## Quick Start

Clone the repository and install dependencies:

```bash
git clone https://github.com/Killer88967/discord-verification.git
cd discord-verification
pnpm install
```

Create the application environment files:

```bash
cp apps/bot/.env.example apps/bot/.env
cp apps/web/.env.example apps/web/.env
```

Fill in the required environment variables, then start the development environment:

```bash
pnpm dev
```

Once the bot is online:

1. Invite it to your Discord server with the required permissions.
2. Run `/setup`.
3. Select the channel where verification should take place.
4. Select the role users should receive after successful verification.
5. Configure optional security rules with `/config security`.
6. Users can then verify through the verification message created by the bot.

---

## Architecture

Discord Verification is split into multiple applications and internal packages.

```text
┌───────────────────────────┐
│       Discord User        │
└─────────────┬─────────────┘
              │
              │ Verify
              ▼
┌───────────────────────────┐
│        Discord Bot        │
│        discord.js         │
└─────────────┬─────────────┘
              │
              │ Creates Session
              ▼
┌───────────────────────────┐
│    PostgreSQL / Prisma    │
│                           │
│  Sessions                 │
│  Users                    │
│  Signals                  │
│  Events                   │
│  Account Links            │
└─────────────┬─────────────┘
              ▲
              │
              │ Reads / Writes Session
              │
              ▼
┌───────────────────────────┐
│       Next.js Web         │
│    Verification App       │
└─────────────┬─────────────┘
              │
              │ Processes Verification
              │ and Security Signals
              ▼
┌───────────────────────────┐
│     Bot Internal API      │
└─────────────┬─────────────┘
              │
              │ Apply Verification
              │ / Enforcement Action
              ▼
┌───────────────────────────┐
│      Discord Server       │
│                           │
│  Role / Reject / Kick /   │
│  Ban                      │
└───────────────────────────┘
```

The bot and web application share database and security logic through internal workspace packages.

---

## Discord Commands

### `/setup`

Configures verification for a Discord server.

Requires the **Manage Server** permission.

The command accepts:

| Option    | Description                                                 |
| --------- | ----------------------------------------------------------- |
| `channel` | Text channel where the verification message will be created |
| `role`    | Role granted after successful verification                  |

The bot checks that:

- The selected channel is a text channel
- The verified role is assignable
- The verified role is below the bot's highest role
- The bot has `Manage Roles`
- The bot can view, send messages, and embed links in the verification channel

After setup, the bot posts a verification message containing a **Verify** button.

### `/config security`

Views or changes server-specific verification security settings.

Requires the **Manage Server** permission.

Available options:

| Option                | Range / Values                  | Description                                |
| --------------------- | ------------------------------- | ------------------------------------------ |
| `minimum-account-age` | `0-3650`                        | Minimum Discord account age in days        |
| `risk-threshold`      | `0-100`                         | Risk score required before enforcement     |
| `risk-action`         | `NONE`, `REJECT`, `KICK`, `BAN` | Action taken when the threshold is reached |

Running `/config security` without options displays the current policy.

### `/check`

Investigates a Discord user's verification history and detected account relationships.

Requires the **Moderate Members** permission.

The command displays information including:

- Whether the user has verified
- Successful verification count
- Rejected verification attempts
- Latest verification session status
- First and last verification timestamps
- Linked accounts
- Relationship confidence
- Relationship match score
- Matching verification signals
- Whether linked accounts are currently in the server

The response is ephemeral and is only visible to the moderator who runs the command.

---

## Server Configuration

Verification settings are stored separately for each Discord server.

Basic verification configuration includes:

- Verification enabled state
- Verification channel
- Verified role
- Logging configuration

Security policy settings include:

- Minimum account age
- Risk threshold
- Risk enforcement action

This allows each server to decide how aggressively suspicious verification attempts should be handled.

### Risk Actions

Servers can currently configure one of the following responses when the configured risk threshold is reached:

| Action   | Behavior                                         |
| -------- | ------------------------------------------------ |
| `NONE`   | Record the result without additional enforcement |
| `REJECT` | Reject the verification attempt                  |
| `KICK`   | Remove the user from the Discord server          |
| `BAN`    | Ban the user from the Discord server             |

---

## Risk Detection

Discord Verification includes a risk-analysis layer designed to detect suspicious verification behavior and potentially related accounts.

Signals that may contribute to account relationships include:

- Device token
- User agent
- Timezone
- Language
- Platform
- Screen information
- Hardware information
- Network information

Relationships can include both direct device-token matches and broader browser-signal matches.

Detected relationships can contain:

- Matching signal types
- Confidence level
- Match score
- First-seen timestamp
- Last-seen timestamp

Confidence levels currently include:

```text
LOW
MEDIUM
HIGH
```

> [!IMPORTANT]
> Account relationships are indicators, not proof that two Discord accounts belong to the same person.
>
> Server moderators should consider the available evidence before taking manual moderation action.

---

## Privacy and Data Handling

Discord Verification processes browser and device information in order to detect suspicious verification activity and potential relationships between accounts.

The system is designed to store verification signals as **hashed values** rather than their original raw values.

Examples of processed signals include:

- Device identifiers generated by the verification system
- Browser user agent
- Timezone
- Language
- Platform
- Screen information
- Hardware information
- Network-related information

Sensitive hashing operations use server-side secrets such as `FINGERPRINT_HMAC_SECRET`.

These secrets must never be exposed to client-side JavaScript or committed to source control.

### Self-Hosting Responsibility

Discord Verification is self-hosted.

Anyone operating an instance is responsible for:

- Securing collected verification data
- Protecting application secrets
- Controlling database access
- Configuring appropriate data retention
- Informing users about collected information when required
- Following applicable privacy and data-protection laws

---

## Production Deployment

The project can be self-hosted, but production deployments should be configured more carefully than the default development environment.

Recommended production practices include:

- Use HTTPS for the verification website
- Use a production PostgreSQL database
- Generate strong, unique application secrets
- Restrict access to the bot's internal API
- Do not expose the internal API directly to the public internet unless properly secured
- Run the bot and web application under dedicated service accounts where possible
- Keep dependencies and the host operating system updated
- Back up the database
- Use firewall or reverse-proxy rules to restrict internal services
- Never commit production `.env` files

The bot and web application must share the same `INTERNAL_API_SECRET`.

---

## Roadmap

Discord Verification is still actively being developed.

### Implemented

- [x] Discord verification sessions
- [x] Single-use verification links
- [x] Web-based verification flow
- [x] Automatic verified-role assignment
- [x] Per-server verification setup
- [x] Browser and device signal collection
- [x] Hashed verification signals
- [x] Verification event history
- [x] Linked-account detection
- [x] Relationship confidence and match scoring
- [x] Moderator account investigation command
- [x] Minimum account-age policy
- [x] Configurable risk threshold
- [x] Reject, kick, and ban risk actions

<!-- ### Planned / Future Improvements

- [ ] Expanded verification configuration
- [ ] Improved moderation and investigation tooling
- [ ] Additional risk signals and detection methods
- [ ] Improved verification logging and audit tools
- [ ] Administration dashboard
- [ ] Improved deployment documentation -->

The roadmap may change as the project develops.

---

## Screenshots

Screenshots and examples of the Discord and web verification flow will be added as the interface continues to develop.

<!--

Suggested screenshots:

1. /setup result and verification message
2. Web verification page
3. Successful verification page
4. /check investigation output
5. /config security output

Example:

![Verification Message](docs/images/verification-message.png)

-->

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
├── .github/                 # GitHub issue/PR configuration
├── apps/
│   ├── bot/                 # Discord bot
│   └── web/                 # Verification website
│
├── packages/
│   ├── database/            # Prisma models and database utilities
│   ├── security/            # Security and verification utilities
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
- pnpm `12.4.1`
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

Start the complete local development environment:

```bash
pnpm dev
```

This starts the local Prisma development database and then launches both the Discord bot and Next.js web application.

The application processes wait for the local database to become available before starting.

You can also run individual applications:

### Web

```bash
pnpm dev:web
```

### Bot

```bash
pnpm dev:bot
```

### Database

```bash
pnpm db:dev
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

Build everything except the web application:

```bash
pnpm build:nw
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
