Feature: Connexion utilisateur
    En tant qu'un utilisateur, je souhaite me connecter à mon compte pour accéder aux fonctionnalités de la plateforme.

    Scenario: Connexion réussie avec des identifiants valides
        Given L'utilisateur est sur la page de connexion
        When L'utilisateur se connecte avec un utilisateur valide
        Then L'utilisateur devrait être redirigé vers la page d'accueil

    Scenario Outline: Connexion échouée avec des identifiants invalides
        Given L'utilisateur est sur la page de connexion
        When L'utilisateur se connecte avec un utilisateur invalide "<email>" et "<password>"
        Then L'utilisateur devrait voir un message d'erreur indiquant que les identifiants sont incorrects
        Examples:
            | email             | password              |
            | email_invalide    | password_invalide     |
            | email_vide        | password_vide         |
            | email_valide      | password_invalide     |

    Scenario: Accès aux ressources protégées sans token
        Given L'utilisateur est sur la page de connexion
        When L'utilisateur essaie d'accéder à une page sécurisée depuis l'url sans token
        Then L'utilisateur devrait rester dans la page de connexion


    Scenario: Accès aux ressources protégées avec token invalide
        Given L'utilisateur est sur la page de connexion
        When L'utilisateur essaie d'accéder à une page sécurisée depuis l'url avec un token invalide
        Then L'utilisateur devrait rester dans la page de connexion