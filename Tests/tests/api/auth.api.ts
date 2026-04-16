import { request, APIRequestContext, Page } from "@playwright/test";

/**
 * Class Authentification via l'API
 */
export class AuthenttificationAPI{

    private apiContext!: APIRequestContext;
    private page: Page
    constructor(page: Page) {
        this.page = page
    }

    /**
     * Connexion et récupération du token via l'API
     * @param email 
     * @param password 
     * @returns 
     */
    async recupererTokenConnexion(email: string, password: string){
        this.apiContext = await request.newContext({
            baseURL: process.env.urlAPI,
        })
        const response = await this.apiContext.post("auth/login",{
            data: {
                email, password
            }
        })
        let accessToken = await response.json();
        await this.apiContext.dispose();
        return await accessToken.token
    }

    /**T
     * Stocker le token dans LocalStorage
     * @param email 
     * @param password 
     */
    async stockerTokenDansLocalStorage(token: string){


    await this.page.addInitScript((t) => {
        localStorage.setItem('token', t);
    }, token);

    }

}