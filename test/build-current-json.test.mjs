import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const EXPECTED_TRACKS = [
  ['solana', 'Solana', 87],
  ['ethereum', 'Ethereum L1', 18],
  ['hyperliquid', 'Hyperliquid', 18],
  ['base', 'Base', 18],
  ['tempo', 'Tempo', 18],
  ['arbitrum', 'Arbitrum', 18],
  ['zcash', 'Zcash', 18],
  ['robinhood', 'Robinhood Chain', 18],
];

const ACCEPTED_SOLANA_URLS = [
  'https://github.com/solana-foundation/pay',
  'https://solana.com/payment-channels',
  'https://solana.com/docs/tokens/extensions/confidential-transfer',
  'https://solana.com/docs/tokenization/token-acl',
  'https://solana.com/docs/tokens/extensions',
  'https://solana.com/docs/payments/subscriptions/overview',
  'https://solana.com/docs/payments/accept-payments/indexing',
  'https://www.youtube.com/watch?v=2pcm7ICRJKU',
];

const FRONTIER_SEMANTIC_SHA256 =
  'f2896b744b6d5399582d75ef49490dc89d3136336e35a97349051211043b39da';

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT_DIR, relativePath), 'utf8'));
}

function resourceLinks(bundle) {
  return bundle.resourceGroups.flatMap((resourceGroup) =>
    resourceGroup.sections.flatMap((section) =>
      section.groups.flatMap((group) => group.links),
    ),
  );
}

function publishedBundle(value) {
  return {
    sponsors: value.sponsors,
    comingSoon: value.comingSoon,
    resources: value.resources,
    rpcProviders: value.rpcProviders,
    resourceGroups: value.resourceGroups,
  };
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }

  return value;
}

test('publishes all eight populated Crypto World\'s Fair tracks', async () => {
  const payload = await readJson('dist/crypto-worlds-fair.json');

  assert.deepEqual(
    payload.tracks.map((track) => [
      track.id,
      track.name,
      resourceLinks(track).length,
    ]),
    EXPECTED_TRACKS,
  );

  for (const track of payload.tracks) {
    const links = resourceLinks(track);
    const urls = links.map((link) => link.url);

    assert.ok(track.resources.length > 0, `${track.id} has no resources`);
    assert.deepEqual(
      track.resources,
      track.resourceGroups.flatMap((group) => group.sections),
      `${track.id} flat and grouped resources differ`,
    );
    assert.equal(
      new Set(urls).size,
      urls.length,
      `${track.id} contains duplicate curated URLs`,
    );
  }
});

test('keeps the top-level bundle equal to the Solana track', async () => {
  const payload = await readJson('dist/crypto-worlds-fair.json');
  const solana = payload.tracks.find((track) => track.id === 'solana');

  assert.ok(solana);
  assert.deepEqual(publishedBundle(payload), publishedBundle(solana));
  assert.deepEqual(await readJson('dist/current.json'), payload);
});

test('uses CWF-only resource keys while preserving Frontier', async () => {
  const manifest = await readJson('manifest.json');
  const cwf = manifest.hackathons['crypto-worlds-fair'];

  assert.ok(
    cwf.resources.every((key) => key.startsWith('crypto-worlds-fair/')),
  );
  assert.ok(
    cwf.tracks.every((track) =>
      track.resources.every((key) =>
        key.startsWith(`crypto-worlds-fair/${track.id}/`),
      ),
    ),
  );

  const frontier = await readJson('dist/frontier.json');
  const semanticHash = createHash('sha256')
    .update(JSON.stringify(canonicalize(frontier)))
    .digest('hex');

  assert.equal(semanticHash, FRONTIER_SEMANTIC_SHA256);
});

test('publishes the reviewed Solana additions without redundant rows', async () => {
  const payload = await readJson('dist/crypto-worlds-fair.json');
  const solana = payload.tracks.find((track) => track.id === 'solana');
  const urls = new Set(resourceLinks(solana).map((link) => link.url));

  for (const url of ACCEPTED_SOLANA_URLS) {
    assert.ok(urls.has(url), `missing reviewed Solana URL: ${url}`);
  }

  assert.ok(!urls.has('https://www.youtube.com/watch?v=amAq-WHAFs8'));
  assert.ok(!urls.has('https://learn.blueshift.gg/en/courses'));
});

test('publishes discoverable track metadata', async () => {
  const publicManifest = await readJson('dist/manifest.json');

  assert.deepEqual(
    publicManifest.hackathons['crypto-worlds-fair'].tracks,
    EXPECTED_TRACKS.map(([id, name]) => ({ id, name })),
  );
});
