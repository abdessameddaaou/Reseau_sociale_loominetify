import { Given, Then, When } from "@cucumber/cucumber";
import { TestWorld } from "../../fixtures/World";
import { json } from "stream/consumers";

Given("Je suis connecté sur la page d'accueil", async function (this: TestWorld) {
    const email =  process.env.email ?? "email"
    const password =  process.env.password ?? "password"
    this.tokenValide = await this.apiAuth.recupererTokenConnexion(email, password)

    console.log('ceci esy le token avant son sauvegarde dans les cookies : ' + this.tokenValide)
    await this.context.addCookies([
        {
            name: 'jwt',
            value: this.tokenValide,
            domain: process.env.BASE_URL,
            path:'/',
            httpOnly: true,
            sameSite: 'Lax',
            expires: Date.now() + 3600 * 1000
        }
])
    const cookies = await this.context.cookies()
    console.log(' ceci est les cookies après ajour du token : ' + JSON.stringify(cookies))

    await this.authPage.navigateToSpecificPage("fil-actualite")    


})

When("Je clique sur le bouton de déconnexion dans le navbar", async function (this: TestWorld) {
    await this.logoutPage.clickLogoutButton()
})

Then("Je devrais être redirigé vers la page de connexion", async function (this: TestWorld) {
    await this.authPage.navigateToSpecificPage('auth')
})