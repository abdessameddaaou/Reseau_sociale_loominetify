Feature: Création d'un compte utilisateur

    L'utilisateur souhaite créer un compte pour qu'il puisse se connecter à l'application


Scenario: Vérifier que l’API de création de compte retourne le bon message et le bon code de retour

Given que l’utilisateur saisit toutes les informations requises pour la création du compte
When il envoie la requête à l’API de création de compte
Then la réponse de l’API contient un message de confirmation "Compte créé avec succès"
And le code de retour HTTP est 201

Scenario: Vérifier que le compte utilisateur est bien créé dans le système

Given qu’un utilisateur a créé un compte via l’API
When une requête de recherche de compte est envoyée à l’API avec ses identifiants
Then l’API renvoie les informations du compte correspondant
And le code de retour HTTP est 200