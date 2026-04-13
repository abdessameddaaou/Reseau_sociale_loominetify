import { Given, When, Then } from "@cucumber/cucumber";
import { AuthentificationPage } from "../../pom/Authentification-pom";

Given('Je suis sur la page de connexion', async function () {
    this.authPage = new AuthentificationPage(this.page)
    await this.authPage.navigateToLoginPage()
});

When('Je me connecte avec un utilisateur valide', async function () {
    const email = process.env.email
    const password = process.env.password
    if (!email || !password) throw new Error('Missing email or password in .env')
    await this.authPage.login(email, password)
});

Then('Je devrais être redirigé vers la page d\'accueil', async function () {

    await this.authPage.shouldBeOnHomePage()

});