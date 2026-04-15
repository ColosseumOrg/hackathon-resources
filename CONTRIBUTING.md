# Contributing

This repo is the source of truth for Colosseum hackathon resource data and sponsor skills. Keep sponsor docs, resource JSON, manifest metadata, and sponsor `SKILL.md` files here rather than duplicating them in downstream consumers.

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

## Add a Sponsor Skill

1. Create `skills/<slug>/SKILL.md`.
2. Keep the skill focused on agent-actionable guidance, not marketing copy.
3. Add references, examples, or MCP config only when the `SKILL.md` depends on them.
4. Add `skillPath` to the sponsor entry in `manifest.json` only after the skill exists.
5. Confirm it is installable:

```bash
npx skills add ColosseumOrg/hackathon-resources --skill <slug>
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
- Keep old skill folders when existing install commands still need to resolve.

## PR Checklist

- `npm run build` passes.
- `manifest.json` references only files that exist.
- New sponsor skills are installable with `npx skills add ColosseumOrg/hackathon-resources --skill <slug>`.
- Resource JSON is valid and follows the HubSection shape.
- GitHub Pages output includes the expected `current.json` changes.
- Downstream advisor copy in `ColosseumOrg/colosseum-resources` only changes when recommendation behavior or install-command text changes.
