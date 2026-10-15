import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BLOG_ITEMLIST_END,
  BLOG_ITEMLIST_START,
  BLOG_LATEST_END,
  BLOG_LATEST_START,
  assertValidPosts,
  filterPosts,
  renderItemListJsonLd,
  syncBlogPosts,
  updateMarkedFile,
} from './sync-blog-posts.mjs';

const seedPosts = [
  { title: { rendered: 'Top Up UC PUBG <em>Murah</em> 2026: Cara Cek Harga &amp; Keamanan Transaksi' }, link: 'https://blog.urity.org/top-up-uc-pubg-murah-2026/', date: '2026-10-01T08:00:00+00:00', slug: 'top-up-uc-pubg-murah-2026' },
  { title: { rendered: 'Tanda Link NAGA5000 Asli dan Cara Memverifikasinya Sebelum Melakukan Pembayaran' }, link: 'https://blog.urity.org/cara-verifikasi-link-naga5000-asli/', date: '2026-09-30T08:00:00+00:00', slug: 'cara-verifikasi-link-naga5000-asli' },
  { title: { rendered: 'NAGA5000 Link Alternatif: Cara Cek Akses dan Keamanan Sebelum Top Up' }, link: 'https://blog.urity.org/naga5000-link-alternatif/', date: '2026-09-29T08:00:00+00:00', slug: 'naga5000-link-alternatif' },
];

const fixture = `<!doctype html>
<html lang="id">
<head>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite"}</script>
</head>
<body>
  <main>
    <section class="latest-articles" aria-labelledby="latest-title">
      <h2 id="latest-title">Artikel terbaru</h2>
      ${BLOG_LATEST_START}
      <ul class="article-list"><li>data lama</li></ul>
      ${BLOG_LATEST_END}
    </section>
  </main>
  ${BLOG_ITEMLIST_START}
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"ItemList","itemListElement":[]}</script>
  ${BLOG_ITEMLIST_END}
</body>
</html>`;

function fakeResponse(body, contentType = 'application/json') {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: (name) => name === 'content-type' ? contentType : null },
    json: async () => body,
  };
}

function expectThrows(callback, message) {
  assert.throws(callback, new RegExp(message));
}

assert.equal(assertValidPosts(seedPosts).length, 3);
assert.equal(filterPosts([...seedPosts, {
  title: { rendered: 'Apa Itu Naga 5000 Slot dan Perjudian?' },
  link: 'https://blog.urity.org/apa-itu-naga-5000-slot/',
  date: '2026-09-28T08:00:00+00:00',
  slug: 'apa-itu-naga-5000-slot',
}]).length, 3);
expectThrows(() => assertValidPosts([...seedPosts, seedPosts[0]]), 'URL duplikat');
expectThrows(() => assertValidPosts([{ ...seedPosts[0], title: { rendered: '' } }]), 'title kosong');
expectThrows(() => assertValidPosts([{ ...seedPosts[0], link: 'http://example.com/post' }]), 'tidak berasal');
expectThrows(() => assertValidPosts([{ ...seedPosts[0], link: 'javascript:alert(1)' }]), 'tidak berasal');

const updated = updateMarkedFile(fixture, assertValidPosts(seedPosts));
assert.match(updated, /BLOG-LATEST-START/);
assert.match(updated, /BLOG-LATEST-END/);
assert.match(updated, /BLOG-ITEMLIST-START/);
assert.match(updated, /BLOG-ITEMLIST-END/);
assert.doesNotMatch(updated, /javascript:/i);
assert.doesNotMatch(updated, /<script[^>]*>.*<script/i);
assert.doesNotMatch(updated, /<em>|<\/em>/i);
assert.match(updated, /Top Up UC PUBG/);
assert.match(updated, /2026/);

const jsonLd = renderItemListJsonLd(assertValidPosts(seedPosts));
const jsonText = jsonLd.slice(jsonLd.indexOf('>') + 1, jsonLd.lastIndexOf('</script>')).trim();
const parsedJsonLd = JSON.parse(jsonText);
assert.equal(parsedJsonLd['@type'], 'ItemList');
assert.equal(parsedJsonLd.itemListElement.length, 3);
assert.ok(parsedJsonLd.itemListElement[0].item.datePublished);
assert.doesNotMatch(jsonText, /<script/i);

const tempDir = await mkdtemp(join(tmpdir(), 'sync-blog-posts-'));
const targetFile = join(tempDir, 'article', 'index.html');
await mkdir(join(tempDir, 'article'), { recursive: true });
await writeFile(targetFile, fixture, 'utf8');
const beforeFailure = await readFile(targetFile, 'utf8');
const result = await syncBlogPosts({
  targetFile,
  fetchImpl: async () => { throw new Error('simulated API failure'); },
  log: { log() {}, warn() {} },
});
assert.equal(result, null);
assert.equal(await readFile(targetFile, 'utf8'), beforeFailure, 'data lama harus dipertahankan');

await writeFile(targetFile, fixture, 'utf8');
const successfulSync = await syncBlogPosts({
  targetFile,
  fetchImpl: async () => fakeResponse(seedPosts),
  log: { log() {}, warn() {} },
});
assert.equal(successfulSync.length, 3);
const afterSuccess = await readFile(targetFile, 'utf8');
assert.match(afterSuccess, /Top Up UC PUBG/);
assert.match(afterSuccess, /1 Oktober 2026/);
assert.match(afterSuccess, /BLOG-LATEST-START/);
assert.match(afterSuccess, /BLOG-ITEMLIST-END/);

console.log('Simulasi sinkronisasi API berhasil.');

console.log('Semua test sync-blog-posts berhasil.');
