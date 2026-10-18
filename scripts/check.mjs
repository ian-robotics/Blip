import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(`${directory}/${entry.name}`) : [`${directory}/${entry.name}`]));
  return nested.flat();
}
const sources = (await files('js')).filter(file => file.endsWith('.js'));
const html = await readFile('index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const file of sources) {
  execFileSync(process.execPath, ['--check', file]);
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
    await access(new URL(match[1], pathToFileURL(resolve(file))));
  }
  for (const match of source.matchAll(/\$\(['"]([^'"]+)['"]\)/g)) {
    if (!ids.includes(match[1])) throw new Error(`Missing DOM ID ${match[1]} in ${file}`);
  }
}
for (const match of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g)) await access(new URL(match[1], pathToFileURL(resolve('index.html'))));
for (const file of (await files('css')).filter(file => file.endsWith('.css'))) {
  const css = await readFile(file, 'utf8');
  for (const match of css.matchAll(/@import\s+url\("([^"]+)"\)/g)) await access(new URL(match[1], pathToFileURL(resolve(file))));
}
console.log(`Checked ${sources.length} JS modules, DOM references, imports and stylesheet paths.`);
