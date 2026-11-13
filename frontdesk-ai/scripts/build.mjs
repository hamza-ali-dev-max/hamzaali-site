// Builds the website into web/dist: renders index.html from the page template and the
// English dictionary, compiles Tailwind, bundles the JavaScript and copies static files.
// Run with: npm run build
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import { renderPage } from '../web/page.mjs';
import { STRINGS } from '../web/src/i18n.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'web');
const dist = path.join(web, 'dist');

// Public settings baked into the build. None of these are secret.
const env = {
  siteUrl: (process.env.SITE_URL || 'https://frontdeskai.co.za').replace(/\/+$/, ''), // PLACEHOLDER domain
  apiBase: (process.env.PUBLIC_API_BASE || '').replace(/\/+$/, ''),
  googleVerification: process.env.GOOGLE_SITE_VERIFICATION || 'PLACEHOLDER_GOOGLE_SITE_VERIFICATION',
};

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
fs.cpSync(path.join(web, 'public'), dist, { recursive: true });

// 1. HTML
const html = renderPage({ env, strings: STRINGS.en });
const banned = html.match(/[—–]|lorem ipsum/i);
if (banned) throw new Error(`Banned text in page: ${JSON.stringify(html.slice(banned.index - 50, banned.index + 20))}`);
fs.writeFileSync(path.join(dist, 'index.html'), html);

// 2. JavaScript
await esbuild.build({
  entryPoints: [path.join(web, 'src', 'main.js')],
  outdir: path.join(dist, 'assets'),
  bundle: true,
  splitting: true,
  format: 'esm',
  minify: true,
  target: ['es2020'],
  entryNames: 'app',
  chunkNames: 'chunk-[name]-[hash]',
  legalComments: 'none',
});

// 3. CSS: Tailwind
const tmpCss = path.join(dist, 'assets', '.app.src.css');
fs.copyFileSync(path.join(web, 'src', 'styles.css'), tmpCss);
execFileSync(path.join(root, 'node_modules', '.bin', 'tailwindcss'), ['-c', path.join(web, 'tailwind.config.cjs'), '-i', tmpCss, '-o', path.join(dist, 'assets', 'app.css'), '--minify'], { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] });
fs.rmSync(tmpCss);

// 4. Settings file the page reads at runtime, plus search engine files
const configFile = path.join(dist, 'site-config.js');
fs.writeFileSync(configFile, fs.readFileSync(configFile, 'utf8').replace('apiBase: ""', `apiBase: ${JSON.stringify(env.apiBase)}`));
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${env.siteUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`);
fs.writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${env.siteUrl}/sitemap.xml\n`);

const size = (file) => `${(fs.statSync(path.join(dist, file)).size / 1024).toFixed(0)} KB`;
console.log(`Built web/dist  index.html ${size('index.html')}  app.css ${size('assets/app.css')}  app.js ${size('assets/app.js')}  (site ${env.siteUrl}, api "${env.apiBase || 'same origin'}")`);
