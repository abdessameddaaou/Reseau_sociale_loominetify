/**
 * Configuration Cucumber.js
 * 
 * Définit la config par défaut : chemins des features, steps et support TypeScript.
 * Pour filtrer par tag, utiliser : npm run test:bdd -- --tags "@login"
 */
module.exports = {
  default: {
    // Chemins vers les fichiers .feature (scénarios Gherkin)
    paths: ['tests/features/**/*.feature'],

    // Module requis pour exécuter du TypeScript directement
    requireModule: ['ts-node/register'],

    // Fichiers chargés automatiquement : hooks (Before/After) + step definitions
    require: [
      'tests/fixtures/**/*.ts',
      'tests/steps/**/*.ts'
    ],
    publishQuiet: true
  }
};