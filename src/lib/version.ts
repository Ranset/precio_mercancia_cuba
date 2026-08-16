import pkg from '../../package.json';

/** Versión de la app. package.json es la única fuente de verdad: no hay que tocar esto al hacer un release. */
export const APP_VERSION: string = pkg.version;
