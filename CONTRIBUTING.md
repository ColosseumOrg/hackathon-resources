# Contributing

This repo is the source of truth for Colosseum hackathon resource data and links to sponsor-hosted skills.

## Add a Sponsor

1. Choose a lowercase, hyphenated slug, for example `phantom`, `arcium`, or `metaplex`.
2. Create `sponsors/<slug>.md` with the sponsor's builder-facing description.
3. Add the slug to the relevant hackathon's `sponsors` array in `manifest.json`.
4. Add a sponsor metadata entry under `sponsors` in `manifest.json`.
5. Include accurate `links`, `tags`, and `accentColor`.
6. Confirm the GitHub Pages publish workflow updates `current.json`.

Sponsor descriptions use plain markdown. No frontmatter is needed. Metadata stays in `manifest.json`.

```markdown
Your sponsor description here. This first paragraph introduces what the sponsor offers builders.

Second paragraph with [inline links](https://example.com) where useful.

- [Get Started](https://docs.example.com)
- [SDK Reference](https://github.com/example/sdk)
```

## Add a Sponsor-Hosted Skill

1. Ask the sponsor to publish their skill in their own public GitHub repository.
2. Keep the skill focused on agent-actionable guidance, not marketing copy.
3. Add `skillRepositoryUrl` and `skillInstallCommand` to the sponsor entry in `manifest.json`.
4. Confirm it is installable:

```bash
npx skills add <owner>/<repo>
```

## Add Curated Resources

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
        {
          "url": "https://example.com",
          "hyperlink": "Link Text",
          "description": "What this links to."
        }
      ]
    }
  ]
}
```

Single-section files contain one HubSection object. `build-paths.json` contains an array of HubSection objects.

To publish a new resource section:

1. Add or update a JSON file in `resources/`.
2. Reference the resource key from the active hackathon in `manifest.json`.
3. Keep every link public and stable.
4. Run `npm run build`.
5. Confirm the GitHub Pages JSON includes the new section after the publish workflow runs.

## Add an Ecosystem Track

Multi-chain hackathons list one entry per ecosystem under `tracks` in the hackathon's
`manifest.json` entry. Track ids are owned by the civitas roster
(`frontend/src/lib/marketing/components/crypto-worlds-fair/tracks/data.ts`) and are never renamed
in place. An id that is not in the roster is silently unused; a roster id that is missing from
`tracks` renders the "will be published" copy. The Crypto World's Fair roster, in order:

| id            | name             |
|---------------|------------------|
| `solana`      | Solana           |
| `ethereum`    | Ethereum L1      |
| `hyperliquid` | Hyperliquid      |
| `base`        | Base             |
| `tempo`       | Tempo            |
| `arbitrum`    | Arbitrum         |
| `zcash`       | Zcash            |
| `robinhood`   | Robinhood Chain  |

The first track (`tracks[0]`) is the default ecosystem. The hackathon's top-level `sponsors`,
`comingSoon`, `resources`, `resourceGroups`, and `rpcProviders` must mirror it. The build fails if
any field differs. Keep the two in sync by hand rather than referencing one from the other.

To add a track:

1. Add a track object with the fixed `id` and `name` from the roster, in roster order.
2. Set `sponsors`, `comingSoon`, `resources`, and `rpcProviders`. Empty arrays are correct for an
   announced ecosystem with nothing confirmed yet. Do not invent sponsors or offers.
3. Reference sponsor slugs from `manifest.sponsors` and RPC slugs from `manifest.rpcProviders`.
   Chain-specific RPC entries are new `manifest.rpcProviders` entries, one per provider-and-offer
   (for example `alchemy` and `quicknode-base`), each with the provider's display `name`.
4. Campaign-specific curated resources go in `resources/<hackathon>/<track>/<key>.json` and are
   referenced as `"<hackathon>/<track>/<key>"`. Use isolated keys when changing a shared file
   would alter another campaign. Leave `resources` empty unless there is curated content.
5. A `resourceGroups` entry may include `description` when the category needs a short orientation
   before its sections.
6. Run `npm test` and check `tracks` in the generated hackathon payload.

```json
{
  "id": "ethereum",
  "name": "Ethereum",
  "sponsors": ["lifi"],
  "comingSoon": [],
  "resources": [],
  "rpcProviders": []
}
```

## Add a Sponsor to a Track

Sponsor markdown and metadata are chain-agnostic and exist once. Add the sponsor's slug to each
track's `sponsors` array where it applies; a sponsor that serves several chains is listed under
each of those tracks. If the sponsor is on the default track, add it to the hackathon's top-level
`sponsors` too. Use `comingSoon` only for a partner the team has actually confirmed.

## Update the Active Hackathon

Set the top-level `current` field in `manifest.json` to the active hackathon slug.

```json
{
  "current": "frontier"
}
```

## Deprecation

- To remove a sponsor, add `"deprecated": true` to the manifest entry first.
- Do not rename slugs in place. Add a new entry and deprecate the old slug.
- Keep old install metadata only while existing install commands still need to resolve.

## PR Checklist

- `npm test` passes.
- `manifest.json` references only files that exist.
- Every `tracks[].id` exists in the civitas roster.
- `tracks[0]` mirrors the top-level bundle.
- New sponsor skills are installable from the sponsor-owned GitHub repo.
- Resource JSON is valid and follows the HubSection shape.
- GitHub Pages output includes the expected `current.json` changes.
- Downstream advisor copy in `ColosseumOrg/colosseum-resources` only changes when recommendation behavior or install-command text changes.
