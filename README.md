# Colosseum Hackathon Resources

Source of truth for Colosseum hackathon developer resources. This repo owns sponsor markdown, curated resource JSON, RPC provider metadata, and links to sponsor-hosted skills.

Published data is consumed by:

- Colosseum platform and marketing resources pages
- `ColosseumOrg/colosseum-resources`, the advisor skill
- Agents discovering sponsor-hosted skills from sponsor GitHub repositories

## Structure

```text
hackathon-resources/
  manifest.json         # Hackathon definitions, active hackathon, sponsor metadata, RPC providers
  sponsors/             # Sponsor descriptions, one markdown file per sponsor
  resources/            # Curated resource lists as HubSection JSON
```

## Published Data

The active resource payload is built by `scripts/build-current-json.mjs` and published to GitHub Pages by `.github/workflows/publish-resources.yml`:

```text
https://ColosseumOrg.github.io/hackathon-resources/current.json
```

Hackathon-specific payloads are published by slug:

```text
https://ColosseumOrg.github.io/hackathon-resources/frontier.json
```

## Sponsor-Hosted Skills

Sponsor skills should live in the sponsor's own GitHub repo so the sponsor can update them independently. Add the sponsor's skill repo and install command to `manifest.json`:

```json
{
  "skillRepositoryUrl": "https://github.com/arcium-hq/agent-skills",
  "skillInstallCommand": "npx skills add arcium-hq/agent-skills"
}
```

Builders install directly from the sponsor repo:

```bash
npx skills add arcium-hq/agent-skills
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
