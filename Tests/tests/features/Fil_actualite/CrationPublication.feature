Feature: Gestion des publications
    En tant qu'utilisateur de l'application, je souhaite créer, consulter, modifier et supprimer des publications afin de partager du contenu avec les autres utilisateurs.

  # === SCÉNARIOS DE CRÉATION ===
  Scenario Outline: Création d'une publication dans le fil d'actualité
    Given L'utilisateur est connecté sur la page d'accueil
    When Il crée une nouvelle publication avec le contenu "<body>"
    Then La publication est créée avec succès dans le fil d'actualité

    Examples:
            | body                              |
            | Ceci est un texte                 |
            | Ceci est un texte avec une photo  |
            | Ceci est un texte avec une vidéo  |
            |                                   |

  # === SCÉNARIOS DE CONSULTATION ===
  Scenario: Consultation d'une publication
    Given Une publication existe avec le titre "Publication with API" 
    When La page de la publication est chargée
    Then Les détails de la publication sont affichés
    And L'auteur est visible
    And La date de création est visible
    And Le contenu est visible

  # === SCÉNARIOS DE MODIFICATION ===
  Scenario: Modification d'une publication réussie
    Given Une publication existe avec le titre "Publication with API"
    And L'utilisateur est l'auteur de la publication
    When Il modifie le contenu de la publication par "Contenu mis à jour"
    Then La modification est sauvegardée avec succès
    And Un indicateur de mise à jour est affiché sur la publication

  Scenario: Tentative de modification d'une publication par un autre utilisateur
    Given Une publication existe et a été créée par un autre utilisateur
    When L'utilisateur tente de modifier le contenu de la publication
    Then La modification est refusée
    And Un message d'erreur est affiché

  # === SCÉNARIOS DE SUPPRESSION ===
  Scenario: Suppression d'une publication réussie
    Given Une publication existe avec le titre "Publication with API"
    And L'utilisateur est l'auteur de la publication
    When Il supprime la publication depuis la page du fil d'actualité
    Then La publication est supprimée avec succès
    And La publication n'apparaît plus dans le fil d'actualité