import { Given, When, Then } from "@cucumber/cucumber";
import { TestWorld } from "../../fixtures/World";

Given("Je suis sur la page de connexion", async function (this: TestWorld) {
    await this.authPage.navigateToLoginPage()
    await this.apiAuth.viderCookiesFromLocalStorage()
});

When("Je me connecte avec un utilisateur valide", async function (this: TestWorld) {
    const email = process.env.email ?? 'email'
    const password = process.env.password ?? 'password'
    await this.authPage.login(email, password)
});
Then("Je devrais être redirigé vers la page d'accueil", async function (this: TestWorld) {
    await this.authPage.shouldBeOnHomePage()
});

//===============================================================================


// Connexion invalide le message d'erreur est failed il doit s'afficher en haut 
When("Je me connecte avec un utilisateur invalide {string} et {string}", async function (this: TestWorld, emailKey: string, passwordKey: string){
    const email = process.env[emailKey] ?? emailKey
    const password = process.env[passwordKey] ?? passwordKey
    await this.authPage.login(email, password)
})
Then("Je devrais voir un message d'erreur indiquant que les identifiants sont incorrects", async function (this: TestWorld) {
    await this.authPage.verifierMessageErreur()
})


//===============================================================================


When("J'essaye d'accéder à une page sécurisé depuis l'url sans token", async function(this: TestWorld){
    await this.authPage.navigateToSpecificPage('fil-actualite')
})

Then("Je devrais rester dans la page de connexion", async function(this: TestWorld){
    await this.authPage.checkLocationURL('/auth')
})

When("J'essaye d'accéder à une page sécurisé depuis l'url avec un token invalide", async function(this: TestWorld){
    await this.apiAuth.stockerTokenDansLocalStorage('token_invalide')
    await this.authPage.navigateToSpecificPage('fil-actualite')
})