import { Given, Then, When } from "@cucumber/cucumber";
import { TestWorld } from "../../fixtures/World";

Given("Je suis connecté sur la page d'accueil", async function (this: TestWorld) {

    await this.context.addCookies([
        {
            name: 'jwt',
            value: this.tokenValide,
            domain: 'recette.loominetify.fr',
            path: '/',
            secure: true,
            sameSite: 'Lax'
        }
    ])
    await this.context.storageState({ path: './auth-state.json' });
    await this.authPage.navigateToSpecificPage("fil-actualite")
    
})

When("Je clique sur le bouton de déconnexion dans le navbar", async function (this: TestWorld) {
    await this.logoutPage.clickLogoutButton()
})

Then("Je devrais être redirigé vers la page de connexion", async function (this: TestWorld) {
    await this.authPage.navigateToSpecificPage('auth')
})