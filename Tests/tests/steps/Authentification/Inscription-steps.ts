import { Given, When, Then } from "@cucumber/cucumber";
import { TestWorld } from "../../fixtures/World";

When("L'utilisateur clique sur le bouton Inscription", async function(this: TestWorld){
    await this.inscriptionPage.navigateToInscriptionPage()
})

When("L'utilisateur saisit des informations d'inscription valides", async function(this: TestWorld){
    const nom = process.env.nom ?? "nom"
    const prenom = process.env.prenom ?? "prenom"
    const email = `adessamed.${Date.now()}@gmail.com`
    const password = process.env.password ?? "password"
    const dateNaissance = process.env.dateNaissance ?? "1990-01-01"
    const paysResidence = process.env.paysResidence ?? "France"
    const villeResidence = process.env.villeResidence ?? "Paris"
    const questionSecrete = "Dans quelle ville êtes-vous né(e) ?"
    const reponseQuestionSecrete = process.env.reponseQuestionSecrete ?? "Medor"

    await this.inscriptionPage.remplirFormulaireInscription(nom, prenom, email, password, dateNaissance, paysResidence, villeResidence, questionSecrete, reponseQuestionSecrete)
})

When("L'utilisateur valide le formulaire", async function(this: TestWorld){

    await this.inscriptionPage.validerInscription()
})

Then("Une pop-up de succès s'affiche confirmant la création du compte", async function(this: TestWorld){
    await this.inscriptionPage.verifierPopupSuccess()
})