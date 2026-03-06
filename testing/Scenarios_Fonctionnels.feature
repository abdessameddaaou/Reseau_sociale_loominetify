# Ce fichier regroupe les scénarios fonctionnels BDD pour Loominetify
# Format : Gherkin / Cucumber

Feature: Authentification et Connexion
  En tant qu'utilisateur de Loominetify
  Je souhaite m'inscrire et me connecter de manière sécurisée
  Afin de pouvoir accéder au réseau social

  Scenario: Inscription d'un nouvel utilisateur avec succès
    Given je suis sur la page d'inscription "/auth"
    When je remplis les informations suivantes:
      | Prénom   | Nom      | Email               | Mot de passe | Date de Naissance |
      | John     | Dupont   | jdupont@exemple.com | Secret123!@  | 15/08/1990        |
    And je clique sur le bouton "S'inscrire"
    Then je devrais voir un message de succès "Compte créé avec succès"
    And un email d'activation contenant le lien d'activation devrait être envoyé à "jdupont@exemple.com"

  Scenario: Connexion réussie à un compte existant
    Given je possède un compte actif avec l'email "jdupont@exemple.com" et le mot de passe "Secret123!@"
    And je suis sur la page de connexion
    When je saisis mon email "jdupont@exemple.com" et mon mot de passe "Secret123!@"
    And je valide le formulaire de connexion
    Then je devrais être redirigé vers le "Fil d'actualité"
    And je devrais voir ma photo de profil dans le Header

  Scenario: Échec de la connexion avec des identifiants invalides
    Given je suis sur la page de connexion
    When je saisis l'email "jdupont@exemple.com" et un mot de passe incorrect "MauvaisPwd123"
    And je valide le formulaire
    Then je devrais voir un message d'erreur indiquant "Identifiants invalides"


Feature: Gestion du Fil d'actualité (Publications)
  En tant qu'utilisateur connecté
  Je souhaite créer des publications (textes/images) et interagir avec d'autres
  Afin de partager mon expérience avec mon réseau

  Scenario: Création d'une publication publique avec texte
    Given je suis connecté à mon compte
    And je suis sur la page du "Fil d'actualité"
    When je saisis "Bonjour tout le monde ! C'est mon premier post." dans la zone de texte du créateur
    And je sélectionne l'option de visibilité "Publique"
    And je clique sur le bouton "Publier"
    Then ma nouvelle publication doit apparaître au sommet de mon fil d'actualité
    And l'icône de visibilité doit afficher une icône "Terre" (Public)
    And une notification (WebSocket) de type "new_publication" doit être émise

  Scenario: Création d'une publication privée avec image
    Given je suis connecté à mon compte
    And je suis sur la page du "Fil d'actualité"
    When je m'apprête à créer un post
    And j'ajoute une image "vacances.jpg" depuis mon ordinateur
    And je sélectionne l'option de visibilité "Privée"
    And je clique sur "Publier"
    Then ma nouvelle publication doit apparaître dans mon fil d'actualité
    And l'icône de visibilité doit afficher un "Cadenas" (Privé)
    But les utilisateurs qui ne sont pas moi ne doivent pas voir ce post dans leur fil d'actualité

  Scenario: Aimer une publication
    Given je suis connecté et sur le fil d'actualité
    And je vois la publication d'un autre utilisateur
    When je clique sur l'icône en forme de "Cœur" (Like) sous le post
    Then l'icône "Cœur" du post devrait devenir rouge (#e11d48)
    And le compteur de "Likes" du post devrait augmenter de 1


Feature: Messagerie et Chat en temps réel
  En tant qu'utilisateur de Loominetify
  Je souhaite discuter avec mes amis
  Afin de communiquer en privé ou en groupe

  Scenario: Envoyer un message privé à un ami
    Given je suis connecté
    And j'ai un ami nommé "Alice Martin"
    And je suis sur la page de messagerie dans la conversation avec "Alice Martin"
    When je saisis "Salut Alice, comment ça va aujourd'hui ?"
    And je clique sur le bouton "Envoyer"
    Then je devrais voir mon message apparaître instantanément dans l'historique de la discussion
    And "Alice Martin" devrait recevoir le message en temps réel via Socket.io

  Scenario: Création d'un groupe de discussion
    Given je suis connecté et sur la page de messagerie
    When je clique sur "Créer un groupe"
    And je définis le nom du groupe "Week-end Ski"
    And j'ajoute "Alice Martin" et "Bob Leponge" aux membres
    And je valide la création
    Then une nouvelle conversation "Week-end Ski" devrait apparaître dans l'onglet des discussions de groupe


Feature: Gestion des Relations (Amis)
  En tant qu'utilisateur cherchant à se connecter
  Je veux envoyer des invitations et consulter le profil d'autres utilisateurs
  Pour élargir mon réseau social

  Scenario: Demande d'ami à un utilisateur
    Given je suis connecté
    And je visite le profil public de "Charlie" qui n'est pas encore mon ami
    When je clique sur le bouton "Envoyer une invitation"
    Then le bouton "Envoyer une invitation" doit devenir "Invitation envoyée"
    And "Charlie" devrait recevoir une notification de demande de relation

  Scenario: Accepter une demande d'ami
    Given je suis connecté
    And j'ai reçu une invitation d'ami "En attente" de la part de "David"
    When je vais sur le profil de "David" 
    And je clique sur "Accepter"
    Then notre relation doit basculer en statut "Ami(e)"
    And "David" doit désormais apparaître dans mon menu latéral "Amis en ligne" (s'il l'est)
