import { Given, When, Then } from "@cucumber/cucumber";
import { TestWorld } from "../../fixtures/World";

Given("L'utilisateur est sur la page de connexion", async function (this: TestWorld) {
    // Naviguer d'abord, puis nettoyer les cookies du contexte
    await this.authPage.navigateToLoginPage()
    await this.context.clearCookies()
});

When("L'utilisateur se connecte avec un utilisateur valide", async function (this: TestWorld) {
    const email = process.env.email ?? 'email'
    const password = process.env.password ?? 'password'
    await this.authPage.login(email, password)
});
Then("L'utilisateur devrait être redirigé vers la page d'accueil", async function (this: TestWorld) {
    await this.authPage.shouldBeOnHomePage()
});

//===============================================================================


// Connexion invalide le message d'erreur est failed il doit s'afficher en haut 
When("L'utilisateur se connecte avec un utilisateur invalide {string} et {string}", async function (this: TestWorld, emailKey: string, passwordKey: string){
    const email = process.env[emailKey] ?? emailKey
    const password = process.env[passwordKey] ?? passwordKey
    await this.authPage.login(email, password)
})
Then("L'utilisateur devrait voir un message d'erreur indiquant que les identifiants sont incorrects", async function (this: TestWorld) {
    await this.authPage.verifierMessageErreur()
})


//===============================================================================


When("L'utilisateur essaie d'accéder à une page sécurisée depuis l'url sans token", async function(this: TestWorld){
    // goToPage car on s'attend à une redirection vers /auth
    await this.authPage.goToPage('fil-actualite')
})

Then("L'utilisateur devrait rester dans la page de connexion", async function(this: TestWorld){
    await this.authPage.checkLocationURL('/auth')
})

When("L'utilisateur essaie d'accéder à une page sécurisée depuis l'url avec un token invalide", async function(this: TestWorld){
    await this.apiAuth.stockerTokenDansLocalStorage('token_invalide')
    // goToPage car on s'attend à une redirection vers /auth
    await this.authPage.goToPage('fil-actualite')
})