import { Page, Locator, expect } from "@playwright/test";

export class AuthentificationPage {

    private page: Page
    private emailInput: Locator
    private passwordInput: Locator
    private loginButton: Locator

    constructor(page: Page){
        this.page = page
        this.emailInput = page.locator('xpath=//form/div[1]/input')
        this.passwordInput = page.locator('xpath=//form/div[2]/input')
        this.loginButton = page.locator('xpath=//form/button')
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
        await this.page.shouldhaveURL('/home')
    }


}