import { Given, When, Then } from "@cucumber/cucumber";

Given("Je suis sur la page de connexion", async function () {
    await this.authPage.navigateToLoginPage()
});

When("Je me connecte avec un utilisateur valide", async function () {
    const email = process.env.email
    const password = process.env.password
    await this.authPage.login(email, password)
});
Then("Je devrais être redirigé vers la page d'accueil", async function () {
    await this.authPage.shouldBeOnHomePage()
});

//===============================================================================

When("Je me connecte avec un utilisateur invalide {string} et {string}", async function (emailKey: string, passwordKey: string) {
    const email = process.env[emailKey]
    const password = process.env[passwordKey]
    await this.authPage.login(email, password)
})
Then("Je devrais voir un message d'erreur indiquant que les identifiants sont incorrects", async function () {
    await this.authPage.verifierMessageErreur()
})


//===============================================================================


When("J'essaye d'accéder à une page sécurisé depuis l'url sans token", async function(){
    
})