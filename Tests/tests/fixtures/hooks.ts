import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { chromium, Browser} from "@playwright/test";
import { TestWorld } from "./World";
import dotenv from 'dotenv';
dotenv.config();


import { AuthentificationPage } from "../pom/Authentification-pom";

let browser: Browser
BeforeAll(async function(){

    // ═══════════════════════════════════════════════════════════
    // 🔧 CONFIGURATION DU NAVIGATEUR (browser.launch)
    // ═══════════════════════════════════════════════════════════
    browser = await chromium.launch({
        headless: false,
        // headless: false,                    // Afficher le navigateur (utile pour le debug)
        slowMo: 500,                        // Ralentir chaque action de 500ms (debug visuel)
        // devtools: true,                     // Ouvrir les DevTools automatiquement
        // channel: 'chrome',                  // Utiliser Chrome installé au lieu de Chromium
        timeout: 30000,                     // Timeout de lancement du navigateur (30s)
        args: ['--start-maximized'],        // Arguments CLI pour le navigateur
        // downloadsPath: './downloads',        // Dossier de téléchargement
        // proxy: {                            // Configuration proxy
        //     server: 'http://proxy:8080',
        //     username: 'user',
        //     password: 'pass',
        // },
    });

})

Before(async function (this: TestWorld) {


    // ═══════════════════════════════════════════════════════════
    // 🌐 CONFIGURATION DU CONTEXTE (browser.newContext)
    // ═══════════════════════════════════════════════════════════

    this.browser = browser
    this.context = await this.browser.newContext({
        baseURL: process.env.BASE_URL,
        // viewport: { width: 1280, height: 720 },    // Taille de la fenêtre
        viewport: null,                             // Désactiver le viewport fixe (plein écran)
        // locale: 'fr-FR',                            // Langue du navigateur
        // timezoneId: 'Europe/Paris',                 // Fuseau horaire
        // colorScheme: 'dark',                        // Mode sombre ('light', 'dark', 'no-preference')
        // permissions: ['geolocation', 'notifications'], // Permissions accordées
        // geolocation: { latitude: 48.856, longitude: 2.352 },  // Position GPS (Paris)
        // userAgent: 'custom-user-agent',             // User-Agent personnalisé
        // storageState: './auth-state.json',          // Charger cookies/localStorage (sessions persistantes)
        // ignoreHTTPSErrors: true,                    // Ignorer les erreurs SSL
        // httpCredentials: {                          // Authentification HTTP basique
        //     username: 'user',
        //     password: 'pass',
        // },
        // extraHTTPHeaders: {                         // Headers HTTP additionnels
        //     'Authorization': 'Bearer token123',
        // },
        // recordVideo: {                              // Enregistrer une vidéo du test
        //     dir: './test-videos',
        //     size: { width: 1280, height: 720 },
        // },
        // isMobile: true,                             // Simuler un mobile
        // hasTouch: true,                             // Activer le tactile
        // javaScriptEnabled: false,                   // Désactiver JavaScript
        // acceptDownloads: true,                      // Accepter les téléchargements
    });
    // ═══════════════════════════════════════════════════════════
    // ⏱️ CONFIGURATION DES TIMEOUTS (page)
    // ═══════════════════════════════════════════════════════════
    this.page = await this.context.newPage();
    this.authPage = await new AuthentificationPage(this.page)
    this.page.setDefaultTimeout(30000);              // Timeout pour les actions (click, fill...) - 30s
    this.page.setDefaultNavigationTimeout(60000);    // Timeout pour les navigations (goto) - 60s
});

After(async function (this: TestWorld) {

    // Fermeture du navigateur après les tests
    await this.page.close();
    await this.context.close();

});

AfterAll(async function () {

    await browser.close();
})
