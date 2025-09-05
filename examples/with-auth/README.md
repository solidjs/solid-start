# SolidStart Template

The **with-auth** example demonstrates native, context-based authentication featuring OAuth and email-password login.

## Installation

Generate the **with-auth** template using your preferred package manager

```bash
# using npm
npm create solid@latest -- -s -t with-auth
```

```bash
# using pnpm
pnpm create solid@latest -s -t with-auth
```

```bash
# using bun
bun create solid@latest --s --t with-auth
```

## Configuration

1. Rename `.env.example` to `.env`

2. For Discord OAuth2 to work, update `.env` with your credentials:

   ```dotenv
   DISCORD_ID=your-discord-client-id
   DISCORD_SECRET=your-discord-client-secret
   ```

   - Create a Discord application at [discord.com/developers/applications](https://discord.com/developers/applications) to get your Client ID and Secret.
   - In the app's **OAuth2 → URL Generator** or **Redirects** section, add the following redirect URI:
     ```
     http://localhost:3000/api/oauth/discord
     ```

3. To configure additional providers, refer to the [start-oauth](https://github.com/thomasbuilds/start-oauth#README) documentation
