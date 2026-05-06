import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from "@cucumber/cucumber";
import { chromium, Browser } from "@playwright/test";
import dotenv from "dotenv";

import { TestWorld } from "./World";
import { AuthentificationPage } from "../pom/Authentification-POM/Login-pom";
import { AuthenttificationAPI } from "../api/auth.api";
import { LogoutPage } from "../pom/Authentification-POM/Logout-pom";
import { InscriptionPage } from "../pom/Authentification-POM/Inscription-pom";

dotenv.config();

let browser: Browser;

// ═══════════════════════════════════════════════════════════
//  Lancement du navigateur (1 fois pour toute la campagne)
// ═══════════════════════════════════════════════════════════

BeforeAll(async () => {
  browser = await chromium.launch({
    headless: false,
    timeout: 30000,
    // slowMo: 1000,
    args: ["--start-maximized"],

  });
});

// ═══════════════════════════════════════════════════════════
//  Avant chaque scénario
// ═══════════════════════════════════════════════════════════

Before(async function (this: TestWorld) {
  const contextOption = {
    baseURL: process.env.BASE_URL,
    viewport: null,
  };

  this.browser = browser;
  this.context = await this.browser.newContext(contextOption);
  this.page = await this.context.newPage();

  this.page.setDefaultTimeout(30_000);
  this.page.setDefaultNavigationTimeout(60_000);

  this.authPage = new AuthentificationPage(this.page);
  this.apiAuth = new AuthenttificationAPI(this.page);
  this.logoutPage = new LogoutPage(this.page);
  this.inscriptionPage = new InscriptionPage(this.page)

});

// ═══════════════════════════════════════════════════════════
// 🧹 Après chaque scénario
// ═══════════════════════════════════════════════════════════

After(async function (this: TestWorld) {
  await this.page.close();
  await this.context.close();
});

// ═══════════════════════════════════════════════════════════
// 🛑 Fin complète des tests
// ═══════════════════════════════════════════════════════════

AfterAll(async () => {
  await browser.close();
});