import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

let userdata, dataincorrect;

before("Récupérer les données de l'utilisateur à créer", () => {
    cy.viderBase();
     return cy.ChargerDonnes().then((data) => {
         userdata = data;
     });
     
});

Given("que l’utilisateur saisit toutes les informations avec le mot de passe {string}", (password) => {

    dataincorrect = { ...userdata, password };
    cy.wrap(dataincorrect).as("data");
});

Given("que l’utilisateur saisit toutes les informations requises pour la création du compte", () => {
    cy.wrap(userdata).as("data");
});

When("il envoie la requête à l’API de création de compte", () => {
    cy.get("@data").then((data) => {
        cy.request({
            method: "POST",
            url: "/users/newUser",
            body: data,
            failOnStatusCode: false,
        }).then((res) => {
            cy.wrap(res).as("res");
        });
    });
});

Then('la réponse de l’API contient un message de confirmation "Compte créé avec succès"', () => {
        cy.get("@res").then((res) => {
            expect(res.body).to.have.property("message");
            expect(res.body.message).to.have.string("Compte créé avec succès");
        });
});

Then("le code de retour HTTP est 201", () => {
    cy.get("@res").then((res) => {
        expect(res.status).to.eq(201);
    });
});

Then("l'API doit retourner le message d'erreur {string}", (expected_message) => {
        cy.get("@res").then((res) => {
            expect(res.body).to.have.property("error");
            expect(res.body.error).to.have.string(expected_message);
        });
});

Then("le code de retour HTTP est 400", () => {
    cy.get("@res").then((res) => {
        expect(res.status).to.eq(400);
    });
});

// Given('qu’un utilisateur a créé un compte via l’API', ()=> {

//     cy.CreerCompte()
// })
// When('une requête de recherche de compte est envoyée à l’API avec ses identifiants', ()=>{

//     cy.log('j\'attend le dev ');
    
// })

// Then('l’API renvoie les informations du compte correspondant', ()=> {

// })

// Then('le code de retour HTTP est 200', ()=> {
    
// })
