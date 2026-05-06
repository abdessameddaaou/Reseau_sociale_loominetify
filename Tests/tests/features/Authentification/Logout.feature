Feature: Déconnexion d'un utilisateur

    En tant qu'un utilisateur connecté, j'aimerais avoir la possibilité de me déconnecter

    Scenario: déconnexion d'un utilisateur depuis la page d'accueil
        Given L'utilisateur est connecté sur la page d'accueil
        When L'utilisateur clique sur le bouton de déconnexion dans le navbar
        Then L'utilisateur devrait être redirigé vers la page de connexion

# #     Scenario: Vérifier la déconnexion si le token est supprimé
# #         Given L'utilisateur est connecté sur la page d'accueil
# #         When L'utilisateur supprime le token depuis localstorage
# #         And L'utilisateur actualise la page
# #         Then L'utilisateur devrait être redirigé vers la page de connexion

