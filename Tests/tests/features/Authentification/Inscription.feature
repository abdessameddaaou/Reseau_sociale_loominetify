Feature: Inscription utilisateur
    En tant qu'utilisateur, je souhaite créer un compte sur l'application, afin d'accéder aux fonctionnalités réservées aux membres

Scenario: Inscription réussie avec des données valides
    Given Je suis sur la page de connexion
    When Je clique sur le bouton Inscription
    And Je saisis des informations d'inscription valides
    And Je valide le formulaire
    Then Une pop-up de succès s'affiche confirmant la création du compte


# Scenario Outline: Échec de l'inscription avec un email déjà utilisé
#     Given un utilisateur avec l'email "<email>" est déjà enregistré
#     And je suis sur la page d'inscription
#     When je remplis le formulaire avec l'email "<email>"
#     And je valide le formulaire
#     Then un message d'erreur s'affiche avec le texte "Email déjà utilisé"
#     And aucun nouveau compte n'est créé en base de données
#     Examples:
#         | email         | 
#         | email_valide  | 