import { Before, Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import 'cypress-xpath'
import locators from "../../support/Locators";

let userdata, dataincorrect;
Before(() => {
  return cy
    .viderBase()                 
    .then(() => cy.ChargerDonnes()) 
    .then((data) => {           
      userdata = data;
      cy.wrap(data).as("userdata"); 
    }).then(()=>{
        cy.visit('/')
    }).then(() => {
        cy.setConnectionConfig( {
        password:"dqoe iemb gnfq azpa",
        user:"loominetify@gmail.com",
        host:'imap.gmail.com',
        port:993,
        tls:true,
        tlsOptions: { rejectUnauthorized: false }
        })
    })
});

/**
 * ========================== API ================================
 */

Given("que l’utilisateur saisit toutes les informations requises pour la création du compte", () => {
    cy.wrap(userdata).as("data");
});

Given("que l’utilisateur saisit toutes les informations avec le mot de passe {string}", (password) => {

    dataincorrect = { ...userdata, password };
    cy.wrap(dataincorrect).as("data");
});

When("il envoie la requête à l’API de création de compte", () => {

    cy.get("@data").then((data) => {
        cy.request({
            method: "POST",
            url: `${Cypress.env("apiUrl")}/users/newUser`,
            body: data,
            failOnStatusCode: false,
        }).then((res) => {
            cy.wrap(res).as("resCreation");
        });
    });
});

Then('la réponse de l’API contient un message de confirmation "Compte créé avec succès"', () => {
        cy.get("@resCreation").then((data) => {
 
            expect(data.body).to.have.property("message");
            expect(data.body.message).to.have.string("Compte créé avec succès");
        });
});

Then("le code de retour HTTP est 201", () => {
    cy.get("@resCreation").then((res) => {
        expect(res.status).to.eq(201);
    });
});

Then("l'API doit retourner le message d'erreur {string}", (expected_message) => {
        cy.get("@resCreation").then((res) => {
            expect(res.body).to.have.property("error");
            expect(res.body.error).to.have.string(expected_message);
        });
});

Then("le code de retour HTTP est 400", () => {
    cy.get("@resCreation").then((res) => {
        expect(res.status).to.eq(400);
    });
});

Given('qu’un utilisateur a créé un compte via l’API', ()=> {

    cy.CreerCompte()
})
When('une requête de recherche de compte est envoyée à l’API avec ses identifiants', ()=>{

    cy.wrap(userdata).as("data");
    cy.get("@data").then((data) =>{
        cy.request({
            method: "GET",
            url: `${Cypress.env("apiUrl")}/users/getUser`,
            body: { "email": userdata.email },
            failOnStatusCode: false
        }).then((res) =>{
            cy.wrap(res).as("resgetUser")
        })
    })
    
})

Then('l’API renvoie les informations du compte correspondant', ()=> {
    cy.get("@resgetUser").then((resgetUser) =>{

        expect(resgetUser.body.user.email).to.equal(userdata.email);
    })
})

Then('le code de retour HTTP est 200', ()=> {
        cy.get("@resgetUser").then((res) => {
        expect(res.status).to.eq(200);
    });
})


/**
 * ========================== IHM ============================
 */
Given('L\'utilisateur est dans la page  de connexion', ()=>{
    cy.url().should('include', 'auth')

})

When('Il clique sur le bouton Inscription',()=>{
    cy.xpath(locators.Inscription.InscriptionButton).should('be.visible')
    cy.xpath(locators.Inscription.InscriptionButton).click()
})

When('Il saisit les informations',()=>{
    cy.xpath(locators.Inscription.Inscription_Nom).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Nom).type(userdata.nom)
    
    cy.xpath(locators.Inscription.Inscription_Prenom).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Prenom).type(userdata.prenom)

    cy.xpath(locators.Inscription.Inscription_Email).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Email).type(userdata.email)

    cy.xpath(locators.Inscription.Inscription_Suivant_Etape_1).click()
    
    cy.xpath(locators.Inscription.Inscription_Password).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Password).type(userdata.password)

    cy.xpath(locators.Inscription.Inscription_Password_Confirmation).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Password_Confirmation).type(userdata.password)

    cy.xpath(locators.Inscription.Inscription_Phone).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Phone).type(userdata.telephone)

    cy.xpath(locators.Inscription.Inscription_Suivant_Etape_2_3).click()

    const [jour, mois, annee] = userdata.dateNaissance.split("-");
    const convertedDate = `${annee}-${mois}-${jour}`;
    cy.xpath(locators.Inscription.Inscription_Date_De_Naissance).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Date_De_Naissance).type(convertedDate)

    // // cy.xpath(locators.Inscription.Inscription_Country_Button).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Country_Button).type(userdata.pays)

    cy.xpath(locators.Inscription.Inscription_Country_Liste).should('be.visible')
    cy.xpath(locators.Inscription.Inscription_Country_Liste).contains('France').click()

    cy.xpath(locators.Inscription.Inscription_Ville).should('be.enabled')
    cy.xpath(locators.Inscription.Inscription_Ville).type(userdata.ville)

    cy.xpath(locators.Inscription.Inscription_Suivant_Etape_2_3).click()

    cy.xpath(locators.Inscription.Inscription_Select_Question).select('Quel est le nom de votre premier animal de compagnie ?')
    cy.xpath(locators.Inscription.Inscription_Response_Question).type(userdata.reponse)
    cy.xpath(locators.Inscription.Finalisation_Inscription_Button).click()
    cy.wait(5000)

})

When('Il doit  recevoir un email de confirmation',()=>{

    cy.getEmailByIndex(1).then((email) => {
    cy.pasteHtml(email.html)
    expect(email.subject).to.eq('Bienvenue sur Loominetfy - Confirmez votre compte')
    cy.contains('Confirmer votre compte').should('be.visible')
    })
})