import { Page, Locator, expect, request } from "@playwright/test";

export class AuthentificationPage {

    private page: Page
    private emailInput: Locator
    private passwordInput: Locator
    private loginButton: Locator
    private messageErreur: Locator

    constructor(page: Page) {
        this.page = page
        this.emailInput = page.locator('input[type="email"]')
        this.passwordInput = page.locator('input[type="password"]')
        this.loginButton = page.locator('form button[type="submit"]')
        this.messageErreur = page.locator('xpath=//div/div[3]/div[2]/div[4]')
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

    async verifierMessageErreur(){
        await expect(this.messageErreur).toHaveText('Email ou mot de passe incorrect.')

    }

    async stockerTokenConnexion(email: string, password: string){
        const apiContext = await request.newContext({
            baseURL: process.env.urlAPI
 
        })

        const response = await apiContext.post("auth/login",{
            data: {
                email, password
            }
        })

        const { accessToken } = await response.json();

        console.log(accessToken);
        await apiContext.dispose();
    

    }

}