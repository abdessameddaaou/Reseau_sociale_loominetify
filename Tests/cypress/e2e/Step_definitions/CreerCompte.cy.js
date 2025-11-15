import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

let userdata

before("Récupérer les données de l'utilisateur à créer",() => {
    
    cy.fixture('CreerUtilisateur').then((data) =>{
        userdata = data
    })
})


Given('que l’utilisateur saisit toutes les informations requises pour la création du compte', ()=>{

    cy.wrap(userdata).as('data')
})

When('il envoie la requête à l’API de création de compte', ()=>{
    cy.get('@data').then((data) =>{
        cy.request({
            method: 'POST',
            url: "/users/newUser",
            body: data
        }).then((res) =>{
            cy.wrap(res).as('res')
        })
    })
})

Then('la réponse de l’API contient un message de confirmation "Compte créé avec succès"', ()=>{
    cy.get('@res').then((res)=>{
        expect(res.body).to.have.property('message')
        expect(res.body.message).to.have.string('Compte créé avec succès')
    })

})

Then('le code de retour HTTP est 201', ()=>{
    cy.get('@res').then((res) =>{
        expect(res.status).to.eq(201)
    })

})