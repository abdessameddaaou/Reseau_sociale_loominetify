Feature: Création d'un compte utilisateur

    L'utilisateur souhaite créer un compte pour qu'il puisse se connecter à l'application


    @API 
    Scenario: Vérifier que l’API de création de compte retourne le bon message et le bon code de retour
        Given que l’utilisateur saisit toutes les informations requises pour la création du compte
        When il envoie la requête à l’API de création de compte
        Then la réponse de l’API contient un message de confirmation "Compte créé avec succès"
        And le code de retour HTTP est 201

    @API
    Scenario Outline: Vérifier que l'API affiche les messages d'erreur lorsque l'utilisateur ne respecte pas les crritères
        Given que l’utilisateur saisit toutes les informations avec le mot de passe "<password>"
        When il envoie la requête à l’API de création de compte
        Then l'API doit retourner le message d'erreur "<expected_message>"
        And le code de retour HTTP est 400
        Examples:
            | password       | expected_message                                                                                                       |
            | Abdelcso2017   | Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial. |
            | AbdelcsoAbdel! | Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial. |
            | Ab2017!        | Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial. |
            | abdelcso2017!  | Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial. |

    # @API
    # Scenario: Vérifier que le compte utilisateur est bien créé dans le système
    #     Given qu’un utilisateur a créé un compte via l’API
    #     When une requête de recherche de compte est envoyée à l’API avec ses identifiants
    #     Then l’API renvoie les informations du compte correspondant
    #     And le code de retour HTTP est 200