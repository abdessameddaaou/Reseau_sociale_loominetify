Feature: Connexion utilisateur
    En tant qu'un utilisateur, je souhaite me connecter à mon compte pour accéder aux fonctionnalités de la plateforme.

    @login @authentification
    Scenario: Connexion réussie avec des identifiants valides
        Given Je suis sur la page de connexion
        When Je me connecte avec un utilisateur valide
        Then Je devrais être redirigé vers la page d'accueil

    @login @authentification
    Scenario Outline: Connexion échouée avec des identifiants invalides
        Given Je suis sur la page de connexion
        When Je me connecte avec un utilisateur invalide "<email>" et "<password>"
        Then Je devrais voir un message d'erreur indiquant que les identifiants sont incorrects
        Examples:
            | email             | password              |
            | email_invalide    | password_invalide     |
            | email_vide        | password_vide         |
            | email_valide      | password_invalide     |

    @login @authentification
    Scenario: Accès aux ressources protégées sans token
        Given Je suis sur la page de connexion
        When J'essaye d'accéder à une page sécurisé depuis l'url sans token
        Then Je devrais rester dans la page de connexion
    @login @authentification
    Scenario: Accès aux ressources protégées avec token invalide
        Given Je suis sur la page de connexion
        When J'essaye d'accéder à une page sécurisé depuis l'url avec un token invalide
        Then Je devrais rester dans la page de connexion