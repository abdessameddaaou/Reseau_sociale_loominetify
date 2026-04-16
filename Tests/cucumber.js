module.exports = {
  default: {
    paths: ['tests/features/**/*.feature'],
    requireModule: ['ts-node/register'],
    require: [
      'tests/fixtures/**/*.ts',
      'tests/steps/**/*.ts'
    ],
    publishQuiet: true
  },

  logout: {
    tags: '@logout',
    publishQuiet: true
  }
};