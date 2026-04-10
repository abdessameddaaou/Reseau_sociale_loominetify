import {Before, After} from "@cucumber/cucumber";
import {chromium} from "@playwright/test";
import { TestWorld } from "./World";


import dotenv from 'dotenv';
dotenv.config();


Before(async function (this: TestWorld) {
  
    // Création d'une instance de navigateur et d'une page
    this.browser= await chromium.launch();
    this.page = await this.browser.newPage();
});

After(async function (this: TestWorld) {
  
    // Fermeture du navigateur après les tests
    await this.page.close();
    await this.browser.close();
});
