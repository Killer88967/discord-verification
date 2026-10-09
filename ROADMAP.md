# Discord Verification Roadmap

This roadmap outlines the planned development of **Discord Verification**, a self-hostable Discord verification system designed to provide secure, configurable verification through a Discord bot and web application.

> [!NOTE]
> This roadmap is not a strict release schedule. Features may be reordered, changed, or removed as the project evolves.

## Current Focus

The current priority is strengthening the existing verification flow, improving guild configuration, and making verification decisions easier for server administrators to understand.

### Core Verification

- [x] Discord OAuth verification
- [x] Single-use verification sessions
- [x] Verified role assignment
- [x] Verification logging
- [x] PostgreSQL-backed verification data
- [x] Internal bot/web communication
- [x] Verification enforcement configuration
- [ ] Improve verification failure handling
- [ ] Improve expired session handling
- [ ] Better verification status messages
- [ ] Allow administrators to manually invalidate sessions

## Risk & Security

- [x] Verification risk scoring
- [x] Hashed verification signals
- [x] Account linking detection
- [x] Guild-specific verification enforcement
- [ ] Improve risk score explanations
- [ ] Expand configurable risk thresholds
- [ ] Detect suspicious verification patterns
- [ ] Add configurable actions based on risk level
- [ ] Improve abuse and replay protection
- [ ] Add rate limiting where appropriate

## Discord Bot

- [x] Discord.js bot foundation
- [x] Verification role assignment
- [x] Guild verification configuration
- [x] Internal API server
- [ ] Improve verification commands
- [ ] Verification status command
- [ ] Manual verification review commands
- [ ] Better permission validation
- [ ] Better Discord error handling
- [ ] Improve logging and diagnostics

## Web Application

- [x] Discord OAuth integration
- [x] Verification session handling
- [x] Verification result processing
- [ ] Improve verification page UI
- [ ] Better loading states
- [ ] Better error states
- [ ] Better expired-session experience
- [ ] Mobile layout improvements
- [ ] Accessibility improvements

## Server Configuration

- [x] Verified role configuration
- [x] Verification enforcement settings
- [x] Risk configuration foundation
- [ ] Guild verification dashboard
- [ ] Configure verification requirements
- [ ] Configure risk thresholds
- [ ] Configure verification logging
- [ ] Configure account-link detection behavior
- [ ] Preview verification configuration
- [ ] Configuration validation

## Moderation & Administration

- [ ] View recent verification attempts
- [ ] View verification history for a user
- [ ] View detected account links
- [ ] View risk score details
- [ ] Manually approve or reject verification
- [ ] Revoke a user's verification
- [ ] Re-run verification checks
- [ ] Filter verification attempts by result or risk

## Privacy

Discord Verification should collect only the information necessary to protect participating servers.

- [x] Hash sensitive verification signals
- [ ] Document collected verification data
- [ ] Document data retention behavior
- [ ] Configurable data retention
- [ ] Automatic cleanup of expired sessions
- [ ] Automatic cleanup of old verification data
- [ ] Improve privacy documentation

## Developer Experience

- [x] TypeScript monorepo
- [x] Shared database package
- [x] Shared security package
- [x] Shared types package
- [x] CI type checking
- [ ] Unit tests
- [ ] Integration tests
- [ ] Verification flow tests
- [ ] Security tests
- [ ] Database migration testing
- [ ] Improve local development setup
- [ ] Automated dependency updates

## Documentation

- [x] Project README
- [ ] Installation guide
- [ ] Configuration reference
- [ ] Environment variable reference
- [ ] Deployment guide
- [ ] Verification flow documentation
- [ ] Risk scoring documentation
- [ ] Security architecture documentation
- [ ] Troubleshooting guide

## Longer-Term Ideas

These are ideas rather than committed features.

- [ ] Custom verification rules
- [ ] Verification rule presets
- [ ] Multi-step verification
- [ ] Temporary verification roles
- [ ] Verification analytics
- [ ] Guild-specific verification branding
- [ ] Webhooks for verification events
- [ ] Public API for integrations
- [ ] Plugin or extension system

## Principles

Discord Verification development should continue to prioritize:

1. **Security first** — verification should make bypassing server protections meaningfully harder.
2. **Privacy by design** — collect and retain only the information necessary for verification and abuse prevention.
3. **Transparent decisions** — administrators should be able to understand why a verification was accepted, rejected, or flagged.
4. **Guild control** — server administrators should decide how strict verification should be for their community.
5. **Reliable verification** — normal users should be able to complete verification without unnecessary friction.
6. **Self-hostability** — the system should remain practical to deploy and operate independently.
7. **Modularity** — the bot, web application, database, and security systems should remain cleanly separated.

---

Discord Verification is actively developed and this roadmap will change as the project grows.
