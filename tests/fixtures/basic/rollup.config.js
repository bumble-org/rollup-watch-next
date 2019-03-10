/* eslint-env node */

export default {
  input: 'tests/fixtures/basic/entry.js',
  output: {
    file: 'tests/fixtures/dest/entry-esm.js',
    format: 'esm',
  },
}
