const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
const createEsbuildPlugin = require("@badeball/cypress-cucumber-preprocessor/esbuild");

module.exports = defineConfig({
  e2e: {
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor",createBundler({plugins: [createEsbuildPlugin.default(config)],}));
      return config;

    },
    specPattern: "cypress/e2e/Features/**/*.feature",
    baseUrl: "http://localhost:3500/api",
    screenshotOnRunFailure: true,
    video: false,
    retries: {
      runMode: 2,
      openMode: 1
    },
    pageLoadTimeout: 10000, // to wait for page transition events or cy.visit(), cy.go(), cy.reload()
    responseTimeout: 10000, // Time, in milliseconds, to wait until a response in a cy.request(), cy.wait(), cy.fixture(), cy.getCookie(), cy.getCookies(), cy.setCookie(), cy.clearCookie(), cy.clearCookies(), and cy.screenshot() commands.
    defaultCommandTimeout: 10000 // wait until most DOM based commands are considered timed out.
  },
});
