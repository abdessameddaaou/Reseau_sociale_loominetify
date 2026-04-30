import { Given, Then, When } from "@cucumber/cucumber";
import { TestWorld } from "../../fixtures/World";


Given("L'utilisateur est connecté sur la page d'accueil", async function (this: TestWorld) {
    const email = process.env.email ?? "email"
    const password = process.env.password ?? "password"
    this.tokenValide = await this.apiAuth.recupererTokenConnexion(email, password)

    await this.context.addCookies([
        {
            name: 'jwt',
            value: this.tokenValide,
            domain: "recette.loominetify.fr",
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: 'Lax',
            expires: Math.floor(Date.now() / 1000) + 3600
        }
    ])
    await this.authPage.navigateToSpecificPage("fil-actualite")
})

When("L'utilisateur clique sur le bouton de déconnexion dans le navbar", async function (this: TestWorld) {
    await this.logoutPage.clickLogoutButton()
})

Then("L'utilisateur devrait être redirigé vers la page de connexion", async function (this: TestWorld) {
    await this.authPage.navigateToSpecificPage('auth')
})