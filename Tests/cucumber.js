/**
 * Configuration Cucumber.js
 * 
 * Utilisation :
 *   npm run test:bdd                         → Tous les tests
 *   npm run test:bdd -- --tags "@login"       → Seulement @login
 */
module.exports = {
  default: {
    // ── Fichiers ──
    paths: ['tests/features/**/*.feature'],       // Scénarios Gherkin
    requireModule: ['ts-node/register'],           // Support TypeScript
    require: [
      'tests/fixtures/**/*.ts',                    // World + hooks
      'tests/steps/**/*.ts'                        // Step definitions
    ],

    // ── Filtrage ──
    // tags: '@login and not @skip',                 // Filtrer par tags
    // ── Rapports ──
    // format: [
    //   'summary',                                  // Résumé dans le terminal
    //   'progress-bar',                             // Barre de progression
    //   'html:reports/rapport.html',                // Rapport HTML (avec screenshots)
    //   'json:reports/rapport.json',                // JSON (pour CI/CD, intégrations)
    //   'junit:reports/rapport.xml',                // JUnit XML (pour Jenkins/GitLab)
    // ],
    // ── Exécution ──
    // parallel: 3,                                  // Exécuter 3 scénarios en parallèle
    // retry: 1,                                     // Relancer 1 fois les scénarios échoués
    // retryTagFilter: '@flaky',                     // Relancer uniquement les @flaky
    // dryRun: false,                                // true = vérifier sans exécuter
    // failFast: true,                               // Stopper dès le 1er échec
    // strict: true,                                 // Échouer si un step est undefined

    // ── Divers ──
    publishQuiet: true,                           // Désactiver le message Cucumber Publish
    // language: 'fr',                               // Langue Gherkin par défaut
  }
};
