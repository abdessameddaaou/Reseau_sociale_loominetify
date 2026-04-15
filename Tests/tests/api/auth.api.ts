import { request, APIRequestContext, Page } from "@playwright/test";

export class AuthenttificationAPI{

    private apiContext!: APIRequestContext;
    private tokenValide: string = ""
    private page: Page
    constructor(page: Page) {
        this.page = page
    }

    async recupererTokenConnexion(email: string, password: string){
        this.apiContext = await request.newContext({
            baseURL: process.env.urlAPI
        })
        const response = await this.apiContext.post("auth/login",{
            data: {
                email, password
            }
        })
        let accessToken = await response.json();
        this.tokenValide = accessToken.token
        await this.apiContext.dispose();
    }

    async stockerTokenDansLocalStorage(token: string){
        await this.page.evaluate((t) => {
            localStorage.setItem('token', t);
        }, token);
    }

}