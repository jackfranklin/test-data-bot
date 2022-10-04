module.exports = {
  require: 'ts-node/register',
  extensions: ['ts'],
  spec: ['src/*.test.ts'],
  'watch-files': ['src'],
};
