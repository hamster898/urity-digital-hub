import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const API_URL =
  'https://blog.urity.org/wp-json/wp/v2/posts?per_page=5&orderby=date&order=desc&status=publish&_fields=link,title,date,slug';
export const ALLOWED_ORIGIN = 'https://blog.urity.org';
export const BLOG_LATEST_START = '<!-- BLOG-LATEST-START -->';
export const BLOG_LATEST_END = '<!-- BLOG-LATEST-END -->';
export const BLOG_ITEMLIST_START = '<!-- BLOG-ITEMLIST-START -->';
export const BLOG_ITEMLIST_END = '<!-- BLOG-ITEMLIST-END -->';
const BLOCKED_CONTENT_PATTERN = /\b(slot|togel|judi|perjudian|gambling)\b/i;

function decodeHtmlEntities(value) {
  return value
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => {
      const radix = code.toLowerCase().startsWith('x') ? 16 : 10;
      const number = Number.parseInt(code.replace(/^x/i, ''), radix);
      return Number.isSafeInteger(number) ? String.fromCodePoint(number) : _;
    })
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

export function plainTitle(renderedTitle) {
  if (typeof renderedTitle !== 'string') return '';

  return decodeHtmlEntities(
    renderedTitle
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

export function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === ALLOWED_ORIGIN && url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validatePost(post, index) {
  if (!post || typeof post !== 'object') {
    throw new Error(`Item ke-${index + 1} bukan object.`);
  }

  const title = plainTitle(post.title?.rendered);
  if (!title) throw new Error(`Item ke-${index + 1} memiliki title kosong.`);
  if (typeof post.link !== 'string' || !isAllowedUrl(post.link)) {
    throw new Error(`URL item ke-${index + 1} tidak berasal dari ${ALLOWED_ORIGIN}/.`);
  }
  if (typeof post.date !== 'string' || Number.isNaN(Date.parse(post.date))) {
    throw new Error(`Tanggal item ke-${index + 1} tidak valid.`);
  }
  if (typeof post.slug !== 'string' || !post.slug.trim()) {
    throw new Error(`Slug item ke-${index + 1} kosong atau tidak valid.`);
  }

  return { title, link: post.link, date: post.date, slug: post.slug };
}

export function assertValidPosts(posts) {
  if (!Array.isArray(posts) || posts.length > 5) {
    throw new Error('Daftar post harus berupa array dengan maksimal lima item.');
  }

  const links = new Set();
  const validated = posts.map(validatePost);
  for (const post of validated) {
    const normalizedLink = new URL(post.link).href;
    if (links.has(normalizedLink)) throw new Error(`URL duplikat: ${post.link}`);
    links.add(normalizedLink);
  }
  return validated;
}

export function filterPosts(posts) {
  if (!Array.isArray(posts)) return posts;
  return posts.filter((post) => {
    const title = plainTitle(post?.title?.rendered);
    const slug = typeof post?.slug === 'string' ? post.slug : '';
    return !BLOCKED_CONTENT_PATTERN.test(`${title} ${slug}`);
  });
}

function formatVisibleDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

export function renderLatestPosts(posts) {
  const items = posts.map((post) => `  <li class="article-list__item">
    <a href="${escapeHtml(post.link)}">${escapeHtml(post.title)}</a>
    <time datetime="${escapeHtml(post.date)}">${escapeHtml(formatVisibleDate(post.date))}</time>
  </li>`).join('\n');
  return `<ul class="article-list">\n${items}\n</ul>`;
}

export function renderItemListJsonLd(posts) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem', position: index + 1,
      item: { '@type': 'BlogPosting', headline: post.title, url: post.link, datePublished: post.date },
    })),
  };
  const json = JSON.stringify(itemList, null, 2)
    .replace(/</g, '\\u003C').replace(/>/g, '\\u003E').replace(/&/g, '\\u0026');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

export function replaceMarkedContent(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Marker tidak lengkap: ${startMarker} / ${endMarker}`);
  }
  const contentStart = start + startMarker.length;
  return `${source.slice(0, contentStart)}\n${replacement}\n${source.slice(end)}`;
}

export function updateMarkedFile(source, posts) {
  let updated = replaceMarkedContent(source, BLOG_LATEST_START, BLOG_LATEST_END, renderLatestPosts(posts));
  updated = replaceMarkedContent(updated, BLOG_ITEMLIST_START, BLOG_ITEMLIST_END, renderItemListJsonLd(posts));
  return updated;
}

async function readExistingFile(targetFile) {
  try { return await readFile(targetFile, 'utf8'); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function writeAtomically(targetFile, content) {
  await mkdir(dirname(targetFile), { recursive: true });
  const temporaryFile = `${targetFile}.tmp`;
  await writeFile(temporaryFile, content, 'utf8');
  try {
    await rename(temporaryFile, targetFile);
  } catch (error) {
    if (!['EEXIST', 'EPERM', 'ENOTEMPTY'].includes(error.code)) throw error;
    await writeFile(targetFile, content, 'utf8');
    await unlink(temporaryFile).catch(() => {});
  }
}

export async function syncBlogPosts({
  apiUrl = process.env.BLOG_API_URL ?? API_URL,
  targetFile = resolve(process.env.BLOG_INDEX_FILE ?? 'artikel/index.html'),
  fetchImpl = fetch,
  log = console,
} = {}) {
  const oldFile = await readExistingFile(targetFile);
  if (oldFile === null) throw new Error(`Target file tidak ditemukan: ${targetFile}`);

  try {
    const response = await fetchImpl(apiUrl, {
      headers: { accept: 'application/json' }, signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new Error(`Response bukan JSON: ${contentType || 'content-type kosong'}`);
    }
    const posts = assertValidPosts(filterPosts(await response.json()));
    await writeAtomically(targetFile, updateMarkedFile(oldFile, posts));
    log.log(`Sinkronisasi berhasil: ${posts.length} post diperbarui di ${targetFile}`);
    return posts;
  } catch (error) {
    log.warn(`Sinkronisasi gagal: ${error.message}`);
    log.warn(`File lama dipertahankan: ${targetFile}`);
    return null;
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) await syncBlogPosts();
