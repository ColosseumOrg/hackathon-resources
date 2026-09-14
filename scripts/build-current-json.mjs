import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Track ids are consumed by the civitas frontend, which validates them against
// this pattern and caps the list at MAX_TRACKS entries.
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const MAX_TRACKS = 20;

function fail(message) {
  throw new Error(message);
}

function isPlainObject(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function assertObject(value, label) {
  if (!isPlainObject(value)) {
    fail(`${label} must be an object`);
  }

  return value;
}

function assertString(value, label) {
  if (typeof value !== 'string') {
    fail(`${label} must be a string`);
  }

  return value;
}

function assertOptionalString(value, label) {
  if (value === undefined) {
    return undefined;
  }

  return assertString(value, label);
}

function assertSlug(value, label) {
  const slug = assertString(value, label);
  if (!SLUG_PATTERN.test(slug)) {
    fail(
      `${label} must be a lowercase slug matching ${SLUG_PATTERN} (got "${slug}")`,
    );
  }

  return slug;
}

function assertOptionalUrl(value, label) {
  const urlString = assertOptionalString(value, label);
  if (urlString === undefined) {
    return undefined;
  }

  let url;
  try {
    url = new URL(urlString);
  } catch {
    fail(`${label} must be a valid URL`);
  }

  if (url.protocol !== 'https:') {
    fail(`${label} must be an HTTPS URL`);
  }

  return urlString;
}

function githubRepoInstallCommand(repositoryUrl) {
  if (repositoryUrl === undefined) {
    return undefined;
  }

  const url = new URL(repositoryUrl);
  if (url.hostname !== 'github.com') {
    fail('skillRepositoryUrl must point to github.com');
  }

  const [owner, repo] = url.pathname.split('/').filter(Boolean);
  if (!owner || !repo) {
    fail('skillRepositoryUrl must point to a GitHub owner/repo');
  }

  return `npx skills add ${owner}/${repo.replace(/\.git$/, '')}`;
}

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label} must be an array`);
  }

  return value;
}

function assertStringArray(value, label) {
  return assertArray(value, label).map((entry, index) =>
    assertString(entry, `${label}[${index}]`),
  );
}

function assertRelativePath(value, label) {
  const relativePath = assertString(value, label);
  const parts = relativePath.split(/[\\/]+/);

  if (
    path.isAbsolute(relativePath) ||
    parts.includes('..') ||
    parts.includes('')
  ) {
    fail(`${label} must be a safe relative path`);
  }

  return relativePath;
}

function sameStringArray(left, right) {
  return (
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

function sameResourceGroups(left, right) {
  if (left === undefined || right === undefined) {
    return left === right;
  }

  return (
    left.length === right.length &&
    left.every((group, index) => {
      const other = right[index];

      return (
        group.id === other.id &&
        group.title === other.title &&
        group.description === other.description &&
        sameStringArray(group.keys, other.keys)
      );
    })
  );
}

async function readTextFile(relativePath) {
  return readFile(path.join(ROOT_DIR, relativePath), 'utf8');
}

async function readJsonFile(relativePath) {
  const content = await readTextFile(relativePath);

  try {
    return JSON.parse(content);
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
  }
}

function normalizeLinks(value, label, textKey = 'label') {
  return assertArray(value, label).map((entry, index) => {
    const link = assertObject(entry, `${label}[${index}]`);

    return {
      [textKey]: assertString(link[textKey], `${label}[${index}].${textKey}`),
      url: assertString(link.url, `${label}[${index}].url`),
      ...(link.description === undefined
        ? {}
        : {
            description: assertString(
              link.description,
              `${label}[${index}].description`,
            ),
          }),
    };
  });
}

function normalizeResourceSection(value, label) {
  const section = assertObject(value, label);
  const groups = assertArray(section.groups, `${label}.groups`).map(
    (groupValue, groupIndex) => {
      const groupLabel = `${label}.groups[${groupIndex}]`;
      const group = assertObject(groupValue, groupLabel);

      return {
        id: assertString(group.id, `${groupLabel}.id`),
        title: assertString(group.title, `${groupLabel}.title`),
        ...(group.summary === undefined
          ? {}
          : { summary: assertString(group.summary, `${groupLabel}.summary`) }),
        links: normalizeLinks(group.links, `${groupLabel}.links`, 'hyperlink'),
      };
    },
  );

  return {
    id: assertString(section.id, `${label}.id`),
    title: assertString(section.title, `${label}.title`),
    ...(section.summary === undefined
      ? {}
      : { summary: assertString(section.summary, `${label}.summary`) }),
    groups,
  };
}

function normalizeResourceSections(value, resourceKey) {
  const sections = Array.isArray(value) ? value : [value];

  return sections.map((section, index) =>
    normalizeResourceSection(section, `resources/${resourceKey}.json[${index}]`),
  );
}

function normalizeSponsorMetadata(value, slug) {
  const sponsor = assertObject(value, `sponsors.${slug}`);

  return {
    name: assertString(sponsor.name, `sponsors.${slug}.name`),
    description: assertOptionalString(
      sponsor.description,
      `sponsors.${slug}.description`,
    ),
    skillRepositoryUrl: assertOptionalUrl(
      sponsor.skillRepositoryUrl,
      `sponsors.${slug}.skillRepositoryUrl`,
    ),
    skillInstallCommand: assertOptionalString(
      sponsor.skillInstallCommand,
      `sponsors.${slug}.skillInstallCommand`,
    ),
    links: normalizeLinks(sponsor.links, `sponsors.${slug}.links`),
    tags: assertStringArray(sponsor.tags, `sponsors.${slug}.tags`),
    accentColor: assertOptionalString(
      sponsor.accentColor,
      `sponsors.${slug}.accentColor`,
    ),
  };
}

function normalizeRpcProvider(value, slug) {
  const provider = assertObject(value, `rpcProviders.${slug}`);

  return {
    name: assertString(provider.name, `rpcProviders.${slug}.name`),
    description: assertString(
      provider.description,
      `rpcProviders.${slug}.description`,
    ),
    ...(provider.offer === undefined
      ? {}
      : { offer: assertString(provider.offer, `rpcProviders.${slug}.offer`) }),
    ...(provider.offerExpires === undefined
      ? {}
      : {
          offerExpires: assertString(
            provider.offerExpires,
            `rpcProviders.${slug}.offerExpires`,
          ),
        }),
    links: normalizeLinks(provider.links, `rpcProviders.${slug}.links`),
  };
}

function normalizeResourceGroups(value, label) {
  if (value === undefined) {
    return undefined;
  }

  return assertArray(value, label).map((groupValue, index) => {
    const groupLabel = `${label}[${index}]`;
    const group = assertObject(groupValue, groupLabel);

    return {
      id: assertString(group.id, `${groupLabel}.id`),
      title: assertString(group.title, `${groupLabel}.title`),
      ...(group.description === undefined
        ? {}
        : {
            description: assertString(
              group.description,
              `${groupLabel}.description`,
            ),
          }),
      keys: assertStringArray(group.keys, `${groupLabel}.keys`),
    };
  });
}

// A "scope" is anything that carries a resource bundle: a hackathon entry or
// one of its tracks. `label` prefixes error messages, e.g.
// `hackathons.crypto-worlds-fair` or `hackathons.crypto-worlds-fair.tracks.ethereum`.
function normalizeResourceScope(scope, label, { rpcProvidersRequired }) {
  return {
    sponsors: assertStringArray(scope.sponsors, `${label}.sponsors`),
    comingSoon:
      scope.comingSoon === undefined
        ? []
        : assertStringArray(scope.comingSoon, `${label}.comingSoon`),
    resources: assertStringArray(scope.resources, `${label}.resources`),
    resourceGroups: normalizeResourceGroups(
      scope.resourceGroups,
      `${label}.resourceGroups`,
    ),
    rpcProviders:
      scope.rpcProviders === undefined && !rpcProvidersRequired
        ? []
        : assertStringArray(scope.rpcProviders, `${label}.rpcProviders`),
  };
}

function normalizeTracks(value, label) {
  if (value === undefined) {
    return undefined;
  }

  const entries = assertArray(value, label);
  if (entries.length === 0) {
    fail(`${label} must include at least one track when present`);
  }

  if (entries.length > MAX_TRACKS) {
    fail(`${label} must include at most ${MAX_TRACKS} tracks`);
  }

  const seenIds = new Set();

  return entries.map((entry, index) => {
    const indexLabel = `${label}[${index}]`;
    const track = assertObject(entry, indexLabel);
    const id = assertSlug(track.id, `${indexLabel}.id`);

    if (seenIds.has(id)) {
      fail(`${label} contains duplicate track id: ${id}`);
    }
    seenIds.add(id);

    return {
      id,
      name: assertString(track.name, `${indexLabel}.name`),
      ...normalizeResourceScope(track, `${label}.${id}`, {
        rpcProvidersRequired: true,
      }),
    };
  });
}

function normalizeHackathon(value, slug) {
  const label = `hackathons.${slug}`;
  const hackathon = assertObject(value, label);

  const normalized = {
    name: assertString(hackathon.name, `${label}.name`),
    ...normalizeResourceScope(hackathon, label, { rpcProvidersRequired: false }),
    tracks: normalizeTracks(hackathon.tracks, `${label}.tracks`),
  };

  // The top-level bundle is the default track's bundle. It is written out
  // explicitly (not inferred) so consumers that ignore `tracks` keep working.
  // Compare every source field so the two published bundles cannot drift.
  if (normalized.tracks) {
    const defaultTrack = normalized.tracks[0];

    if (
      !sameStringArray(defaultTrack.sponsors, normalized.sponsors) ||
      !sameStringArray(defaultTrack.comingSoon, normalized.comingSoon) ||
      !sameStringArray(defaultTrack.resources, normalized.resources) ||
      !sameResourceGroups(
        defaultTrack.resourceGroups,
        normalized.resourceGroups,
      ) ||
      !sameStringArray(defaultTrack.rpcProviders, normalized.rpcProviders)
    ) {
      fail(
        `${label}.tracks[0] ("${defaultTrack.id}") is the default track, so its resource bundle must equal the top-level bundle`,
      );
    }
  }

  return normalized;
}

function normalizeManifest(value) {
  const manifest = assertObject(value, 'manifest');
  const hackathonEntries = Object.entries(
    assertObject(manifest.hackathons, 'manifest.hackathons'),
  );

  if (hackathonEntries.length === 0) {
    fail('manifest.hackathons must include at least one hackathon');
  }

  const sponsors = Object.fromEntries(
    Object.entries(assertObject(manifest.sponsors, 'manifest.sponsors')).map(
      ([slug, sponsor]) => [slug, normalizeSponsorMetadata(sponsor, slug)],
    ),
  );

  const rpcProviders = Object.fromEntries(
    Object.entries(
      assertObject(manifest.rpcProviders ?? {}, 'manifest.rpcProviders'),
    ).map(([slug, provider]) => [slug, normalizeRpcProvider(provider, slug)]),
  );

  const normalized = {
    version: assertString(manifest.version, 'manifest.version'),
    current: assertString(manifest.current, 'manifest.current'),
    hackathons: Object.fromEntries(
      hackathonEntries.map(([slug, hackathon]) => [
        slug,
        normalizeHackathon(hackathon, slug),
      ]),
    ),
    sponsors,
    rpcProviders,
  };

  if (!normalized.hackathons[normalized.current]) {
    fail(`manifest.current points to missing hackathon: ${normalized.current}`);
  }

  return normalized;
}

async function loadSponsor(slug, sponsor) {
  const contentPath = `sponsors/${assertRelativePath(
    `${slug}.md`,
    `sponsor slug "${slug}"`,
  )}`;
  const content = (await readTextFile(contentPath)).trim();
  const skillInstallCommand =
    sponsor.skillInstallCommand ??
    githubRepoInstallCommand(sponsor.skillRepositoryUrl);

  if (sponsor.skillInstallCommand && !sponsor.skillRepositoryUrl) {
    fail(
      `sponsors.${slug}.skillInstallCommand requires skillRepositoryUrl to be set`,
    );
  }

  const output = {
    name: sponsor.name,
    slug,
    ...(sponsor.description === undefined
      ? {}
      : { description: sponsor.description }),
    ...(sponsor.skillRepositoryUrl === undefined
      ? {}
      : { skillRepositoryUrl: sponsor.skillRepositoryUrl }),
    ...(skillInstallCommand === undefined
      ? {}
      : { skillInstallCommand }),
    links: sponsor.links,
    tags: sponsor.tags,
    ...(sponsor.accentColor === undefined
      ? {}
      : { accentColor: sponsor.accentColor }),
    hasSkill: sponsor.skillRepositoryUrl !== undefined,
    content,
  };

  return output;
}

async function loadResourceSections(resourceKey) {
  assertRelativePath(`${resourceKey}.json`, `resources key "${resourceKey}"`);
  const value = await readJsonFile(`resources/${resourceKey}.json`);

  return normalizeResourceSections(value, resourceKey);
}

// Memoises sponsor markdown and resource JSON reads across the top-level bundle
// and every track of one hackathon, so a sponsor listed on eight tracks is read
// once. Repeated occurrences serialise to identical JSON.
function createBundleLoaders(manifest) {
  const sponsorsBySlug = new Map();
  const sectionsByResourceKey = new Map();

  return {
    loadSponsor(slug) {
      if (!sponsorsBySlug.has(slug)) {
        sponsorsBySlug.set(slug, loadSponsor(slug, manifest.sponsors[slug]));
      }

      return sponsorsBySlug.get(slug);
    },
    loadResourceSections(resourceKey) {
      if (!sectionsByResourceKey.has(resourceKey)) {
        sectionsByResourceKey.set(resourceKey, loadResourceSections(resourceKey));
      }

      return sectionsByResourceKey.get(resourceKey);
    },
  };
}

// Turns a normalised scope (hackathon or track) into the published bundle:
// { sponsors, comingSoon, resources, rpcProviders, resourceGroups? }.
async function buildResourceBundle(scope, label, manifest, loaders) {
  const resources = [];
  const sectionsByResourceKey = new Map();

  for (const resourceKey of scope.resources) {
    let sections;
    try {
      sections = await loaders.loadResourceSections(resourceKey);
    } catch (error) {
      if (error.code === 'ENOENT') {
        fail(`${label}.resources references missing resource: ${resourceKey}`);
      }

      throw error;
    }

    sectionsByResourceKey.set(resourceKey, sections);
    resources.push(...sections);
  }

  const sponsors = [];
  for (const sponsorSlug of scope.sponsors) {
    if (!manifest.sponsors[sponsorSlug]) {
      fail(`${label}.sponsors references missing sponsor: ${sponsorSlug}`);
    }

    sponsors.push(await loaders.loadSponsor(sponsorSlug));
  }

  const comingSoon = scope.comingSoon.map((sponsorSlug) => {
    const sponsor = manifest.sponsors[sponsorSlug];
    if (!sponsor) {
      fail(`${label}.comingSoon references missing sponsor: ${sponsorSlug}`);
    }

    return {
      slug: sponsorSlug,
      name: sponsor.name,
      description: sponsor.description ?? 'Coming soon',
    };
  });

  const rpcProviders = scope.rpcProviders.map((providerSlug) => {
    const provider = manifest.rpcProviders[providerSlug];
    if (!provider) {
      fail(`${label}.rpcProviders references missing provider: ${providerSlug}`);
    }

    return provider;
  });

  const bundle = {
    sponsors,
    comingSoon,
    resources,
    rpcProviders,
  };

  if (scope.resourceGroups) {
    bundle.resourceGroups = scope.resourceGroups.map((group) => ({
      id: group.id,
      title: group.title,
      ...(group.description === undefined
        ? {}
        : { description: group.description }),
      sections: group.keys.flatMap((resourceKey) => {
        const sections = sectionsByResourceKey.get(resourceKey);
        if (!sections) {
          fail(
            `${label}.resourceGroups.${group.id} references missing resource: ${resourceKey}`,
          );
        }

        return sections;
      }),
    }));
  }

  return bundle;
}

async function buildHackathonPayload(slug, hackathon, manifest) {
  const label = `hackathons.${slug}`;
  const loaders = createBundleLoaders(manifest);

  const payload = {
    hackathon: {
      name: hackathon.name,
      slug,
    },
    ...(await buildResourceBundle(hackathon, label, manifest, loaders)),
  };

  if (hackathon.tracks) {
    payload.tracks = [];

    for (const track of hackathon.tracks) {
      payload.tracks.push({
        id: track.id,
        name: track.name,
        ...(await buildResourceBundle(
          track,
          `${label}.tracks.${track.id}`,
          manifest,
          loaders,
        )),
      });
    }
  }

  return payload;
}

async function writeJson(relativePath, value) {
  await writeFile(
    path.join(DIST_DIR, relativePath),
    `${JSON.stringify(value, null, 2)}\n`,
  );
}

async function main() {
  const manifest = normalizeManifest(await readJsonFile('manifest.json'));
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });

  const publicManifest = {
    version: manifest.version,
    current: manifest.current,
    hackathons: Object.fromEntries(
      Object.entries(manifest.hackathons).map(([slug, hackathon]) => [
        slug,
        {
          name: hackathon.name,
          ...(hackathon.tracks
            ? {
                tracks: hackathon.tracks.map((track) => ({
                  id: track.id,
                  name: track.name,
                })),
              }
            : {}),
        },
      ]),
    ),
  };

  await writeJson('manifest.json', publicManifest);

  for (const [slug, hackathon] of Object.entries(manifest.hackathons)) {
    const payload = await buildHackathonPayload(slug, hackathon, manifest);
    await writeJson(`${slug}.json`, payload);

    if (slug === manifest.current) {
      await writeJson('current.json', payload);
    }

    console.log(
      `Built ${slug}.json (${payload.sponsors.length} sponsors, ${payload.resources.length} resource sections, ${payload.tracks?.length ?? 0} tracks)`,
    );
  }

  console.log(`Built current.json for ${manifest.current}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
