import { Given, When, Then } from "@cucumber/cucumber";
import { AuthentificationPage } from "../../pom/Authentification-pom";

Given ('Je suis sur la page de connexion', async function () {
    this.authPage = new AuthentificationPage(this.page)
    

});