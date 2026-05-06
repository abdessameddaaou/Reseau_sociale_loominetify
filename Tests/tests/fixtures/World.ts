import { Browser, BrowserContext, Page } from "@playwright/test";
import { AuthentificationPage } from "../pom/Authentification-POM/Login-pom";
import { AuthenttificationAPI } from "../api/auth.api";
import { LogoutPage } from "../pom/Authentification-POM/Logout-pom";
import { InscriptionPage } from "../pom/Authentification-POM/Inscription-pom";

export interface TestWorld {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    authPage: AuthentificationPage;
    apiAuth: AuthenttificationAPI;
    logoutPage: LogoutPage
    inscriptionPage: InscriptionPage
    tokenValide: string

}