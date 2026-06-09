# 🤖 UpFox - Discord Administration & Utility Bot

UpFox est un bot Discord modulaire développé en **JavaScript** avec la bibliothèque **Discord.js (v14+)**. Il a été conçu pour automatiser l'accueil des membres, gérer des systèmes d'attribution de rôles par réaction, et fournir des outils de modération et d'administration avancés pour les salons textuels.

Ce projet applique les bonnes pratiques d'architecture événementielle et de gestion des permissions asynchrones (Promises, async/await).

---

## 🛠️ Stack Technique & Prérequis

* **Environnement de reexécution :** Node.js (v16.11.0+)
* **Bibliothèque principale :** `discord.js`
* **Gestion de l'environnement :** `dotenv` (pour la sécurisation du token de l'API Discord)
* **Intents requis (Gateway) :**
  * `Guilds` (Structure du serveur)
  * `GuildMessages` (Lecture/Envoi de messages)
  * `MessageContent` (Accès au texte brut des commandes)
  * `GuildMembers` (Événements de membres et gestion des rôles)
  * `GuildMessageReactions` (Détection des clics sur les émojis)
* **Partials activés :** `GuildMember`, `User`, `Message`, `Reaction` (assure l'écoute sur les anciens messages hors-cache).

---

## 📂 Fonctionnalités du Projet

Le cycle de vie du bot est divisé en plusieurs gestionnaires d'événements majeurs :

### 1. Gestion des Membres (`guildMemberAdd` / `guildMemberRemove`)
* **Accueil automatisé :** Envoie un message de bienvenue personnalisé aux nouveaux utilisateurs dans un salon spécifique (`ID_SALON_BIENVENUE`).
* **Suivi des départs :** Notifie le départ d'un membre en affichant son `displayName` serveur.

### 2. Système de Commandes Centralisé (`messageCreate`)
Les commandes et processus passifs au sein du salon textuel sont segmentés en trois catégories distinctes :

#### 🔄 Partie Automatique (Passive)
* **Réaction Émoji :** Détecte la présence d'un émoji personnalisé (`emojiPanneau`) dans n'importe quel message du serveur et y ajoute automatiquement une réaction identique.

#### 👤 Partie Client (Tout utilisateur)
* `!hello` : Salue l'utilisateur en retour en affichant son nom d'utilisateur global ainsi que son pseudo d'affichage spécifique au serveur.
* `!roll` : Génère un nombre pseudo-aléatoire entre 1 et 6 inclus (`Math.random()`) et répond sous forme de lancer de dé.

#### 🛡️ Partie Admin & Modération (Permissions requises)
* `!message [#salon] [texte]` : *(Permission : Gérer les messages)* Permet à un modérateur d'envoyer un message anonymisé via le bot dans le salon ciblé. La commande initiale est supprimée pour garder le salon propre.
* `!react [ID_Message] [:emoji:] [@Role]` : *(Permission : Gérer les rôles)* Initialise un système persistant de **Reaction Role** à l'aide d'un `ReactionCollector`. Ajouter la réaction attribue le rôle ciblé, la retirer supprime le rôle.
* `!muteAll` : *(Permission : Administrateur)* Modifie les permissions locales du salon actuel via l'ACL (`permissionOverwrites`) pour interdire l'envoi de messages au rôle `@everyone`. Les administrateurs conservent le droit d'écriture.
* `!unmuteAll` : *(Permission : Administrateur)* Réinitialise les permissions d'écriture du salon actuel pour le rôle `@everyone` (remise à `null`).
* `!clear [nombre]` : *(Permission : Administrateur)* Supprime les *n* derniers messages d'un salon. Comprend un système de confirmation par `MessageCollector` (`!ok` / `!cancel`). Un algorithme de filtrage temporel exclut automatiquement les messages de plus de 14 jours pour éviter les crashs de l'API Discord.

---

## 🚀 Comment relancer le projet ?

1. Installez les dépendances du projet :
```bash
   npm install discord.js dotenv
   ```
2. Possède un fichier .env contenant :
```bash
   DISCORD_TOKEN=votre_token_secret_ici
   ```
3. Lance le bot :
```bash
   node index.js
   ```
