# Agent Guidelines

- This repository is public. PR titles, descriptions, and commit messages describe only the public change: no links to or numbers from private repositories, internal tools such as Linear or Railway, costs, or internal process.
- Use each sponsor's official name, capitalization, and documentation links, and check that every link you add resolves.
- `test/build-current-json.test.mjs` pins a hash of the generated `frontier.json`, so editing a shared sponsor entry for one campaign fails the build. Change shared entries only when every campaign should change.
- Follow `CONTRIBUTING.md` for the data format, and run `npm test` before pushing.
