Feature: Déconnexion d'un utilisateur

    En tant qu'un utilisateur connectén j'aimerais avoir la possibilité de me déconnecté
    @logout @authentification
    Scenario: déconnexion d'un utilisateur depuis la page d'accueil
        Given Je suis connecté sur la page d'accueil
        When Je clique sur le bouton de déconnexion dans le navbar
        Then Je devrais être redirigé vers la page de connexion

#     Scenario: Vérifier la déconnexion si le token est supprimé
#         Given Je suis connecté sur la page d'accueil
#         When Je supprime le token depuis localstorage
#         And J'actualise la page
#         Then Je devrais être redirigé vers la page de connexion

