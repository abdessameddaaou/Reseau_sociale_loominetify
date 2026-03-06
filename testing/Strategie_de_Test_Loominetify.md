# Stratégie de Test pour Loominetify

## 1. Introduction
Ce document définit la stratégie globale de test pour l'application **Loominetify**, un réseau social développé avec un backend Node.js (Express, Sequelize) et un frontend Angular (Tailwind CSS).
L'objectif est d'assurer la fiabilité, la sécurité et la bonne ergonomie de l'application avant sa mise en production.

## 2. Objectifs des Tests
- Vérifier que toutes les fonctionnalités clés (Authentification, Fil d'actualité, Messagerie en temps réel, Gestion des amis) fonctionnent comme prévu.
- S'assurer que les performances et la sécurité des websockets (Socket.io) et des requêtes HTTP (API REST) sont optimisées.
- Garantir le bon fonctionnement de l'application sur différentes tailles d'écran (Responsive Design).
- Valider le comportement hors-ligne ou les erreurs de réseau (gestion des erreurs 4xx, 5xx).

## 3. Périmètre des Tests (In-Scope)
- **Front-end (Angular)**: Composants UI, routing, state management (services), formulaires interactifs, design responsive (Tailwind).
- **Back-end (Node.js/Express)**: API REST, WebSockets, logique métier (contrôleurs), et sécurité (JWT, hachage des mots de passe).
- **Base de données (MySQL/Sequelize)**: Intégrité des données, migrations (comme l'ajout de la colonne `visibility`), et requêtes optimisées.

## 4. Niveaux de Tests
### 4.1. Tests Unitaires (TU)
- **Frontend** : Tests avec Jasmine/Karma (ou Jest) pour valider la logique isolée des composants (ex: formatage des dates `timeAgo`, traductions `ngx-translate`).
- **Backend** : Tests avec Jest/Mocha sur les fonctions utiles (ex: génération d'username, hachage de mot de passe).

### 4.2. Tests d'Intégration (TI)
- **API** : Vérification des endpoints de l'API avec Supertest ou Postman (ex: tester le flux de création d'une publication privée).
- **WebSockets** : Tester l'émission et la réception des événements `new_message`, `new_publication`, `new_comment` via des clients socket simulés.

### 4.3. Tests End-to-End (E2E) / Fonctionnels
- **Outils** : Cypress ou Playwright.
- **Principe** : Simuler les parcours utilisateurs réels de bout en bout (Inscription -> Connexion -> Ajout d'ami -> Messagerie -> Création de post). Les cas de tests Gherkin définis en annexe serviront de base à l'automatisation.

## 5. Tests Non-Fonctionnels
- **Tests de Charge** : Utiliser un outil comme Artillery ou k6 pour simuler plusieurs connexions websockets simultanées afin de valider la stabilité du serveur de messagerie.
- **Accessibilité (a11y)** : S'assurer que le mode sombre et le mode clair respectent un bon contraste (comme réglé pour les étiquettes "Publique/Privée").
- **Sécurité** : Validation des injections SQL (gérées par Sequelize), des attaques XSS et validation des tokens JWT sur les routes protégées (`/api/*`).

## 6. Environnements de Test
1. **Local (Développement)** : `localhost:4200` et `localhost:3000`. Base de données de dev locale locale.
2. **Staging (Pré-production)** : VPS pour tester les builds Angular (`dist/`) et le PM2 pour le back-end avec une base de données MySQL réaliste.
3. **Production** : Environnement Live. Seulement des tests de santé (health-checks) et vérification post-déploiement.

## 7. Gestion des Anomalies
- Tous les bugs trouvés durant l'exécution des tests Gherkin doivent être notés en format :
  - Nom du bug, Sévérité (Basse, Moyenne, Haute, Critique), Étapes de reproduction, Résultat attendu vs Résultat obtenu, et Logs (Console/Network).

## 8. Critères d'Acceptation (Definition of Done)
- Code revu et approuvé.
- Les tests unitaires et E2E (Gherkin) passent à 100%.
- Aucune régression critique identifiée.
- L'interface UI respecte le design (y compris le mode sombre).
