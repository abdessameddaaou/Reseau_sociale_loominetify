import { Given, Then, When } from "@cucumber/cucumber";
import { Page } from "@playwright/test";
import { TestWorld } from "../../fixtures/World";

Given("Je suis connecté sur la page d'accueil", async function(this: TestWorld) {
    this.apiAuth.recupererTokenConnexion(process.env.email!, process.env.password!)
    console.log(this.tokenValide)
    // await this.apiAuth.stockerTokenDansLocalStorage(this.tokenValide)
})

When("Je clique sur le bouton de déconnexion dans le navbar", async function(this: TestWorld) {
    await this.logoutPage.clickLogoutButton()
}) 

Then("Je devrais être redirigé vers la page de connexion", async function(this: TestWorld) {
    await this.authPage.navigateToSpecificPage('/auth')
})