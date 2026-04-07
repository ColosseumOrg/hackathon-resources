# Hackathon Resources

Single source of truth for Colosseum hackathon developer resources. This data powers the developer resources page on the Colosseum platform and is consumed by builder agents via Colosseum Copilot.

## Directory Structure

```
hackathon-resources/
  manifest.json         # Top-level manifest: hackathon definitions, sponsor metadata, RPC providers
  resources/            # Curated resource lists (JSON files)
    start-here.json
    learn-solana.json
    examples-reference.json
    infra-tooling.json
    build-paths.json
  skills/               # Sponsor SKILL.md files for AI agents
    <sponsor-slug>/
      SKILL.md
      references/       # Optional reference docs
  README.md
```

## Conventions

### Sponsor Slugs

Sponsor directory names are **lowercase, hyphenated, short identifiers**:

| Sponsor Name               | Slug       |
|----------------------------|------------|
| Phantom                    | `phantom`  |
| Squads Multisig + Altitude | `squads`   |
| World                      | `world`    |
| Arcium                     | `arcium`   |
| Reflect                    | `reflect`  |
| MoonPay                    | `moonpay`  |
| Metaplex                   | `metaplex` |
| Swig                       | `swig`     |

### Link Format

Resource links use this shape:

```json
{
  "url": "https://example.com",
  "hyperlink": "Display Text",
  "description": "Optional one-line description."
}
```

## How to Add a New Sponsor

1. Choose a slug following the convention above
2. Create `skills/<slug>/SKILL.md` with the agent skill definition
3. Add the slug to the relevant hackathon's `sponsors` array in `manifest.json`
4. Add a sponsor entry under `sponsors` in `manifest.json`

## How to Add Resources

Resource files live in `resources/` and follow the HubSection schema:

```json
{
  "id": "section-id",
  "title": "Section Title",
  "summary": "Optional subtitle.",
  "groups": [
    {
      "id": "group-id",
      "title": "Group Title",
      "links": [
        { "url": "https://...", "hyperlink": "Link Text", "description": "What this links to." }
      ]
    }
  ]
}
```

Single-section files contain one HubSection object. `build-paths.json` contains an array of HubSection objects.

## API

These resources are served via the Colosseum platform API:

- `GET /api/hackathon-resources/:hackathonSlug` — Full manifest for a hackathon
- `GET /api/hackathon-resources/:hackathonSlug/llms.txt` — AI-readable text format
- `GET /api/hackathon-resources/:hackathonSlug/skills/:sponsor/skill.md` — Per-sponsor SKILL.md
- `GET /api/hackathon-resources/:hackathonSlug/skills` — List available skills
