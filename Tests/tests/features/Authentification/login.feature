Feature: Connexion utilisateur
    En tant qu'un utilisateur, je souhaite me connecter à mon compte pour accéder aux fonctionnalités de la plateforme.

    Scenario: Connexion réussie avec des identifiants valides
        Given Je suis sur la page de connexion
        When Je me connecte avec un utilisateur valide
        Then Je devrais être redirigé vers la page d'accueil