import { Before, After, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { chromium, Browser} from "@playwright/test";
import { TestWorld } from "./World";
import dotenv from 'dotenv';
import fs from 'fs'
dotenv.config();


import { AuthentificationPage } from "../pom/Authentification-POM/Login-pom";
import { AuthenttificationAPI } from "../api/auth.api";
import { LogoutPage } from "../pom/Authentification-POM/Logout-pom";

    let browser: Browser
    const STORAGE_STATE = './auth-state.json';


BeforeAll(async function(){

    // ═══════════════════════════════════════════════════════════
    // 🔧 CONFIGURATION DU NAVIGATEUR (browser.launch)
    // ═══════════════════════════════════════════════════════════
    browser = await chromium.launch({
        headless: false,
        // headless: false,                    // Afficher le navigateur (utile pour le debug)
        // slowMo: 500,                        // Ralentir chaque action de 500ms (debug visuel)
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

    let contextOption: any = {
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
    }


    // Vérification si le fichier des états existe
    if(fs.existsSync(STORAGE_STATE) && fs.statSync(STORAGE_STATE).size > 0){
         contextOption.storageState = STORAGE_STATE
    }

    // ═══════════════════════════════════════════════════════════
    // 🌐 CONFIGURATION DU CONTEXTE (browser.newContext)
    // ═══════════════════════════════════════════════════════════

    this.browser = browser
    this.context = await this.browser.newContext(contextOption);
    this.page = await this.context.newPage();
    // ═══════════════════════════════════════════════════════════
    // ⏱️ CONFIGURATION DES TIMEOUTS (page)
    // ═══════════════════════════════════════════════════════════


    // ═══════════════════════════════════════════════════════════
    //              Instanciation des objects 
    // ═══════════════════════════════════════════════════════════

    this.authPage = await new AuthentificationPage(this.page)
    this.apiAuth = await new AuthenttificationAPI(this.page)
    this.logoutPage = await new LogoutPage(this.page)


    // ═══════════════════════════════════════════════════════════
    //              Stockage / Récupération de l'état 
    // ═══════════════════════════════════════════════════════════

    if(!contextOption.storageState){
            const email = process.env.email ?? "email"
            const password = process.env.password ?? "password"
            this.tokenValide = await this.apiAuth.recupererTokenConnexion(email, password)
            this.apiAuth.stockerTokenDansLocalStorage(this.tokenValide)
            await this.context.storageState({ path: STORAGE_STATE })
    }

    this.page.setDefaultTimeout(30000);              // Timeout pour les actions (click, fill...) - 30s
    this.page.setDefaultNavigationTimeout(60000);    // Timeout pour les navigations (goto) - 60s
});

After(async function (this: TestWorld) {

    await this.page.close();
    await this.context.close();
});

AfterAll(async function () {
    await browser.close();
})
