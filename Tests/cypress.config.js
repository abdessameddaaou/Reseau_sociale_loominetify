const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");
const cymapTasks = require("cymap/src/cymapTasks")

module.exports = defineConfig({
  e2e: {
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor",createBundler({plugins: [createEsbuildPlugin.default(config)],}));
      on("task",{...cymapTasks});
      return config;
    },

    specPattern: "cypress/e2e/Features/**/*.feature",
    baseUrl: "http://localhost:4200/auth",

    env: {
      apiUrl: "http://localhost:3500/api",

    },

    screenshotOnRunFailure: true,
    video: false,
    retries: {
      runMode: 2,
      openMode: 1,
    },
    pageLoadTimeout: 10000,
    responseTimeout: 10000,
    defaultCommandTimeout: 10000,
  },
});
