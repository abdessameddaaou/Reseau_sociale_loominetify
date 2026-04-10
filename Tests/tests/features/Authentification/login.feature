Feature:
    En tant qu'un utilisateur, je sougaite me connecter à mon compte pour accéder aux fonctionnalités de la plateforme.

        scenario: Connexion réussie avec des identifiants valides
            Given Je suis sur la page de connexion
            When Je me connexte avec un utilisateur valide
            Then Je devrais être redirigé vers la page d'accueil