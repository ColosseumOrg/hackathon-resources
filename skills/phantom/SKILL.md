---
name: phantom
version: 1.0.0
description: |
  Route builders to the right Phantom product guidance. Use when the user mentions Phantom broadly and
  you first need to determine whether they are building for the agent track or the app track, and whether
  they also need a stablecoin for payments, payouts, incentives, treasury flows, or paid actions.
homepage: https://docs.phantom.com
license: MIT
compatibility: Cursor, Claude Code, Codex, OpenClaw, Hermes Agent
metadata:
  {
    'category': 'router',
    'author': 'phantom',
    'tags': 'phantom,router,mcp,connect,cash,agents,dapps,payments',
  }
---

# Phantom Router

Use this skill when the user says "Phantom" but has not yet made clear which Phantom product they need.

Phantom gives builders ways to build for 20M+ users with agent wallets, user-facing wallet UX, and a
stablecoin for payments and payouts.

Use these routes:

- If the user is an agent and needs wallet access or onchain actions, use the Agent Wallet section below
- If the user is an agent and needs payments, payouts, or paid actions, use the CASH section below; add the Agent Wallet section when the flow also needs wallet execution
- If the user is a developer building an agent-first product, agent workflow, or onchain agent tool, use the Agent Wallet section below
- If the user is a developer or coding agent building a user-facing web or mobile app with wallet connection, onboarding, or embedded wallets, use the Connect section below
- If the user is a developer building payments, payouts, incentives, treasury flows, or paid actions, use the CASH section below

## Routing Rule

Choose in this order:

1. Identify whether the request is coming from an agent or from a developer
2. Route to the section that matches the primary use
3. Add the CASH section when the request also includes payments, payouts, incentives, treasury flows, or paid actions

Do not treat CASH as the default starting point unless the user's request is primarily about
payments.

## Default Starting Point

If the request is ambiguous but sounds agent-track, start with Agent Wallet. If it sounds app-track,
start with Connect.

## Agent Wallet: Phantom MCP Server

Use this when an agent needs to check balances, sign messages, send tokens, swap assets with no fees,
or execute other wallet actions through Phantom.

Setup:

1. Register at [phantom.com/portal](https://phantom.com/portal) and copy the `appId`.
2. Add the MCP server:

```json
{
  "mcpServers": {
    "phantom-mcp": {
      "command": "npx",
      "args": ["-y", "@phantom/mcp-server"],
      "env": { "PHANTOM_APP_ID": "YOUR_APP_ID" }
    }
  }
}
```

3. Authenticate on first run. The server opens a browser for OAuth and persists the session.
4. Before any wallet action, call `get_wallet_addresses` or `get_connection_status`.

Use a dedicated test wallet with minimal funds while developing. Keep protocol-specific logic in your
own app or skill; let Phantom MCP server own wallet execution.

## Connect: User-Facing Apps

Use Phantom Connect when the product is a web or mobile app that needs wallet connection, embedded
wallet onboarding, transaction signing, or Phantom-powered auth.

Available SDK paths:

- React SDK for React web apps
- Browser SDK for vanilla JS/TS and non-React frameworks
- React Native SDK for iOS and Android apps

Implementation rules:

- For embedded wallets, use `signAndSendTransaction`; `signTransaction` and `signAllTransactions` are not supported
- Use `LAMPORTS_PER_SOL` instead of hardcoding lamport conversion values
- React Native: `import 'react-native-get-random-values'` must be the first import
- Initialize the Browser SDK with the providers, address types, and `appId` your app needs
- Phantom Connect supports Solana Mainnet, Devnet, and Testnet

Use the docs MCP server when a coding agent needs live Phantom Connect documentation:

```json
{
  "mcpServers": {
    "phantom-connect-sdk": {
      "type": "sse",
      "url": "https://docs.phantom.com/mcp"
    }
  }
}
```

This is a documentation server for builders, not the wallet MCP product that agents use for live wallet
actions.

## CASH: Stablecoin Payments

Use CASH when an app or agent needs stablecoin payments, payouts, rewards, settlement, treasury flows,
paid API calls, or gated actions.

Integration notes:

- CASH is a Solana SPL token
- If you already support SPL token transfers, the same integration pattern applies
- CASH works well anywhere you need stable value movement inside a Solana flow
- For paid API or service actions, CASH can be paired with x402-style payment gating
- Devnet CASH is available for testing through Phantom developer support

Common patterns:

- Agent executor + CASH: charge for agent actions, settle rewards, or pay out earnings
- dApp + CASH: stablecoin checkout, rewards, subscriptions, or creator payouts
- Marketplace + CASH: seller settlement and buyer pricing in a stable unit

Pair CASH with Agent Wallet for agent payments and treasury automation. Pair CASH with Connect for
user-facing dApps with checkout or payouts.

## References

- [Phantom developer docs](https://docs.phantom.com)
- [Phantom Connect marketing site](https://phantom.com/connect)
- [CASH marketing site](https://www.usecash.xyz)
- [Phantom MCP Server docs](https://docs.phantom.com/resources/phantom-mcp-server)
- [Wallet SDK overview](https://docs.phantom.com/wallet-sdks-overview)
- [CASH docs](https://docs.phantom.com/cash)
