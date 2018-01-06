// Based upon https://github.com/alexjoverm/typescript-library-starter/blob/master/rollup.config.ts

import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import sourceMaps from 'rollup-plugin-sourcemaps';

const pkg = require('./package.json');

const libraryName = 'index';

export default {
  input: `dist/es/${libraryName}.js`,
  output: [
    { file: pkg.main, name: libraryName, format: 'umd' },
    { file: pkg.module, format: 'es' },
  ],
  sourcemap: true,
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  external: [],
  watch: {
    include: 'dist/es/**',
  },
  plugins: [
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),

    // Resolve source maps to the original source
    sourceMaps(),
  ],
};
