import { Browser, BrowserContext, Page } from "@playwright/test";
import { AuthentificationPage } from "../pom/Authentification-pom";

export interface TestWorld {
    browser: Browser;
    context: BrowserContext;
    page: Page;
    authPage?: AuthentificationPage;
}