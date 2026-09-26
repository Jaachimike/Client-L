declare const __APP_VERSION__: string | undefined;

/** Stamped into both the page and the server code at build time, from package.json. */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev';
