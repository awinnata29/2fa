import { copyFile, cp, mkdir } from 'node:fs/promises';

await mkdir('dist/images', { recursive: true });
await cp('public/images', 'dist/images', { recursive: true });

for (const file of ['favicon.ico', 'robots.txt', 'sitemap.xml', '_headers', '_redirects']) {
    await copyFile(`public/${file}`, `dist/${file}`);
}
