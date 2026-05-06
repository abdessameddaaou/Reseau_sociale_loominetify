import { Locator, Page, expect } from "@playwright/test";

export class InscriptionPage {

    private page: Page
    private InscriptionButton: Locator
    private nomInput: Locator
    private Prenom: Locator
    private emailInput: Locator
    private passwordInput: Locator
    private confirmationPasswordInput: Locator
    private dateNaissance: Locator
    private paysResidenceInput: Locator
    private paysResidenceDropdown: Locator
    private villeResidence: Locator
    private questionSecrete: Locator
    private reponseQuestionSecrete: Locator
    private inscrireButton: Locator
    private suivantButtonPage1: Locator
    private suivantButtonPage2: Locator
    private suivantButtonPage3: Locator
    private popupSuccess: Locator

    constructor(page: Page) {
        this.page = page

        this.InscriptionButton = page.locator('xpath=//div[2]/div[3]/button[2]')

        // Page 1 du formulaire d'inscription
        this.nomInput = page.locator('xpath=//form/div[1]/input')
        this.Prenom = page.locator('xpath=//form/div[2]/input')
        this.emailInput = page.locator('xpath=//form/div[3]/input')
        this.suivantButtonPage1 = page.locator('xpath=//app-auth-user//form/button')

        // Page 2 du formulaire d'inscription
        this.passwordInput = page.locator('xpath=//form/div[1]/input')
        this.confirmationPasswordInput = page.locator('xpath=//form/div[2]/input')
        this.suivantButtonPage2 = page.locator('xpath=//form/div[4]/button[2]')

        // Page 3 du formulaire d'inscription
        this.dateNaissance = page.locator('xpath=//form/div[1]/input')
        this.paysResidenceInput = page.locator('xpath=//form/div[2]/div/div')
        this.paysResidenceDropdown = page.locator('xpath=//form/div[2]/div/ul')
        this.villeResidence = page.locator('xpath=//form/div[3]/input')
        this.suivantButtonPage3 = page.locator('xpath=//form/div[4]/button[2]')

        // Page 4 du formulaire d'inscription
        this.questionSecrete = page.locator('xpath=//form/div[1]/select')
        this.reponseQuestionSecrete = page.locator('xpath=//form/div[2]/input')
        this.inscrireButton = page.locator('xpath=//form/div[3]/button[2]')

        // pop-up de succès
        this.popupSuccess = page.locator('xpath=//*[@id="swal2-title"]')
    }


    async navigateToInscriptionPage() {
        await expect(this.InscriptionButton).toBeVisible()
        await this.InscriptionButton.click()
    }

    async remplirFormulaireInscription(nom: string, prenom: string, email: string, password: string, dateNaissance: string, paysResidence: string, villeResidence: string, questionSecrete: string, reponseQuestionSecrete: string) {

        // Page 1
        await this.InscriptionButton.click()
        await this.nomInput.fill(nom)
        await this.Prenom.fill(prenom)
        await this.emailInput.fill(email)
        await this.suivantButtonPage1.click()

        // Page 2
        await this.passwordInput.fill(password)
        await this.confirmationPasswordInput.fill(password)
        await this.suivantButtonPage2.click()

        // Page 3 
        await this.dateNaissance.fill(dateNaissance)
        await this.paysResidenceInput.click()
        await this.paysResidenceDropdown.locator(`li:has-text("${paysResidence}")`).click()
        await this.villeResidence.fill(villeResidence)
        await this.suivantButtonPage3.click()

        // Page 4
        await this.questionSecrete.selectOption({ value: questionSecrete })
        await this.reponseQuestionSecrete.fill(reponseQuestionSecrete)
    }

    async validerInscription() {
        await this.inscrireButton.click()
    }

    async verifierPopupSuccess() {
        await expect(this.popupSuccess).toHaveText('Inscription réussie')
    }
}