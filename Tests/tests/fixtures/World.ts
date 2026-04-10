import { Browser, Page } from "@playwright/test";
import { AuthentificationPage } from "../pom/Authentification-pom";

export interface TestWorld {
    browser: Browser;
    page: Page;
    authPage?: AuthentificationPage;
}