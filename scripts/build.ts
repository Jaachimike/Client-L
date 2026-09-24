import { copyFileSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { build as bundle } from 'esbuild';
import { build as buildClient } from 'vite';
import { SERVER_FUNCTIONS } from '../src/shared/api';

const DIST = 'dist';
const GLOBAL = '__app';

const MENU_FUNCTIONS = ['onOpen', 'menuSetup', 'menuAddSampleData', 'menuClearSampleData'];

/** Apps Script only calls top-level functions, so each export gets a plain global wrapper. */
function globalWrappers(): string {
  const api = SERVER_FUNCTIONS.map(
    (name) =>
      `function ${name}() { return ${GLOBAL}.serverFunctions.${name}.apply(null, arguments); }`,
  );
  return [
    `function doGet(e) { return ${GLOBAL}.doGet(e); }`,
    `function setup() { return ${GLOBAL}.setup(); }`,
    ...MENU_FUNCTIONS.map((name) => `function ${name}(e) { return ${GLOBAL}.${name}(e); }`),
    ...api,
  ].join('\n');
}

async function buildServer(): Promise<void> {
  const result = await bundle({
    entryPoints: ['src/server/index.ts'],
    bundle: true,
    format: 'iife',
    globalName: GLOBAL,
    target: 'es2020',
    platform: 'neutral',
    mainFields: ['module', 'main'],
    write: false,
    legalComments: 'none',
  });
  const code = result.outputFiles[0]?.text ?? '';
  writeFileSync(`${DIST}/Code.js`, `${code}\n${globalWrappers()}\n`);
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST);
await buildClient({ logLevel: 'warn' });
await buildServer();
copyFileSync('appsscript.json', `${DIST}/appsscript.json`);
const size = readFileSync(`${DIST}/index.html`).byteLength;
console.log(
  `Built ${DIST}/index.html (${Math.round(size / 1024)} KB), ${DIST}/Code.js, ${DIST}/appsscript.json`,
);
