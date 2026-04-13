import { Page, Locator, expect } from "@playwright/test";

export class AuthentificationPage {

    private page: Page
    private emailInput: Locator
    private passwordInput: Locator
    private loginButton: Locator

    constructor(page: Page){
        this.page = page
        this.emailInput = page.locator('input[type="email"], input[name="email"]')
        this.passwordInput = page.locator('input[type="password"]')
        this.loginButton = page.locator('form button[type="submit"], form button')
    }

    async navigateToLoginPage() {
        await this.page.goto('/')
    }

    async login(email: string, password: string) {
        await this.emailInput.fill(email)
        await this.passwordInput.fill(password)
        await this.loginButton.click()
    }

    
    async shouldBeOnHomePage() {
        await expect(this.page).toHaveURL('/fil-actualite')
    }


}