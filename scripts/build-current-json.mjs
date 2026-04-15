import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

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

async function fileExists(relativePath) {
  try {
    await access(path.join(ROOT_DIR, relativePath));
    return true;
  } catch {
    return false;
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
    skillPath:
      sponsor.skillPath === undefined
        ? undefined
        : assertRelativePath(sponsor.skillPath, `sponsors.${slug}.skillPath`),
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

function normalizeHackathon(value, slug) {
  const hackathon = assertObject(value, `hackathons.${slug}`);

  return {
    name: assertString(hackathon.name, `hackathons.${slug}.name`),
    sponsors: assertStringArray(
      hackathon.sponsors,
      `hackathons.${slug}.sponsors`,
    ),
    comingSoon:
      hackathon.comingSoon === undefined
        ? []
        : assertStringArray(
            hackathon.comingSoon,
            `hackathons.${slug}.comingSoon`,
          ),
    resources: assertStringArray(
      hackathon.resources,
      `hackathons.${slug}.resources`,
    ),
    resourceGroups:
      hackathon.resourceGroups === undefined
        ? undefined
        : assertArray(
            hackathon.resourceGroups,
            `hackathons.${slug}.resourceGroups`,
          ).map((groupValue, index) => {
            const groupLabel = `hackathons.${slug}.resourceGroups[${index}]`;
            const group = assertObject(groupValue, groupLabel);

            return {
              id: assertString(group.id, `${groupLabel}.id`),
              title: assertString(group.title, `${groupLabel}.title`),
              keys: assertStringArray(group.keys, `${groupLabel}.keys`),
            };
          }),
    rpcProviders:
      hackathon.rpcProviders === undefined
        ? []
        : assertStringArray(
            hackathon.rpcProviders,
            `hackathons.${slug}.rpcProviders`,
          ),
  };
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
  const skillPath =
    sponsor.skillPath ??
    `skills/${assertRelativePath(`${slug}/SKILL.md`, `sponsor slug "${slug}"`)}`;
  const hasSkill = await fileExists(skillPath);

  if (sponsor.skillPath && !hasSkill) {
    fail(`sponsors.${slug}.skillPath points to a missing file: ${skillPath}`);
  }

  const output = {
    name: sponsor.name,
    slug,
    ...(sponsor.description === undefined
      ? {}
      : { description: sponsor.description }),
    ...(hasSkill ? { skillPath } : {}),
    links: sponsor.links,
    tags: sponsor.tags,
    ...(sponsor.accentColor === undefined
      ? {}
      : { accentColor: sponsor.accentColor }),
    hasSkill,
    content,
  };

  return output;
}

async function loadResourceSections(resourceKey) {
  assertRelativePath(`${resourceKey}.json`, `resources key "${resourceKey}"`);
  const value = await readJsonFile(`resources/${resourceKey}.json`);

  return normalizeResourceSections(value, resourceKey);
}

async function buildHackathonPayload(slug, hackathon, manifest) {
  const resources = [];
  const sectionsByResourceKey = new Map();

  for (const resourceKey of hackathon.resources) {
    const sections = await loadResourceSections(resourceKey);
    sectionsByResourceKey.set(resourceKey, sections);
    resources.push(...sections);
  }

  const sponsors = [];
  for (const sponsorSlug of hackathon.sponsors) {
    const sponsor = manifest.sponsors[sponsorSlug];
    if (!sponsor) {
      fail(
        `hackathons.${slug}.sponsors references missing sponsor: ${sponsorSlug}`,
      );
    }

    sponsors.push(await loadSponsor(sponsorSlug, sponsor));
  }

  const comingSoon = hackathon.comingSoon.map((sponsorSlug) => {
    const sponsor = manifest.sponsors[sponsorSlug];
    if (!sponsor) {
      fail(
        `hackathons.${slug}.comingSoon references missing sponsor: ${sponsorSlug}`,
      );
    }

    return {
      slug: sponsorSlug,
      name: sponsor.name,
      description: sponsor.description ?? 'Coming soon',
    };
  });

  const rpcProviders = hackathon.rpcProviders.map((providerSlug) => {
    const provider = manifest.rpcProviders[providerSlug];
    if (!provider) {
      fail(
        `hackathons.${slug}.rpcProviders references missing provider: ${providerSlug}`,
      );
    }

    return provider;
  });

  const payload = {
    hackathon: {
      name: hackathon.name,
      slug,
    },
    sponsors,
    comingSoon,
    resources,
    rpcProviders,
  };

  if (hackathon.resourceGroups) {
    payload.resourceGroups = hackathon.resourceGroups.map((group) => ({
      id: group.id,
      title: group.title,
      sections: group.keys.flatMap((resourceKey) => {
        const sections = sectionsByResourceKey.get(resourceKey);
        if (!sections) {
          fail(
            `hackathons.${slug}.resourceGroups.${group.id} references missing resource: ${resourceKey}`,
          );
        }

        return sections;
      }),
    }));
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
        { name: hackathon.name },
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
      `Built ${slug}.json (${payload.sponsors.length} sponsors, ${payload.resources.length} resource sections)`,
    );
  }

  console.log(`Built current.json for ${manifest.current}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
