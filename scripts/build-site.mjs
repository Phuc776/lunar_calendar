import { mkdir, readFile, cp, writeFile } from 'node:fs/promises';
const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const root = new URL('../site-dist/', import.meta.url);
await mkdir(new URL('assets/', root), { recursive: true });
await cp(new URL('../web/', import.meta.url), root, { recursive: true });
await cp(new URL('../app-icon.svg', import.meta.url), new URL('assets/logo.svg', root));
const base = `https://github.com/Phuc776/lunar_calendar/releases/download/v${version}`;
await writeFile(new URL('release.json', root), JSON.stringify({ version, installer: `${base}/Lich-am-${version}-setup.exe`, portable: `${base}/Lich-am.exe`, checksums: `${base}/SHA256SUMS.txt` }, null, 2));
console.log(`Static download site built: site-dist (v${version})`);
