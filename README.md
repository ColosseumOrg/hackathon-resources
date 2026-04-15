# Hackathon Resources

Source of truth for Colosseum hackathon developer resources. This repo owns sponsor markdown, curated resource JSON, RPC provider metadata, and sponsor skills.

Published data is consumed by:

- Colosseum platform and marketing resources pages
- `ColosseumOrg/colosseum-resources`, the advisor skill
- Agents installing sponsor-specific skills directly from this repo

## Structure

```text
hackathon-resources/
  manifest.json         # Hackathon definitions, active hackathon, sponsor metadata, RPC providers
  sponsors/             # Sponsor descriptions, one markdown file per sponsor
  resources/            # Curated resource lists as HubSection JSON
  skills/               # Sponsor SKILL.md files for AI agents
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

## Sponsor Skills

Sponsor skills are installed directly from this source repo:

```bash
npx skills add ColosseumOrg/hackathon-resources --skill phantom
npx skills add ColosseumOrg/hackathon-resources --skill arcium
```

List available sponsor skills:

```bash
npx skills add ColosseumOrg/hackathon-resources --list --full-depth -y
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
