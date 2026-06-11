# 🦊 UpFox Bot

UpFox est un bot Discord de modération, d'administration et d'automatisation communautaire écrit en **JavaScript** avec la bibliothèque **Discord.js (v14)**. Conçu dans une optique de modularité et de scalabilité, le projet sépare rigoureusement ses commandes selon le principe de séparation des préoccupations (*Separation of Concerns*).

---

## 🚀 Fonctionnalités Principales

* **🛡️ AutoMod Passif :** Système automatique de détection du spam temporel, filtrage des insultes/grossièretés et contrôle de l'abus de majuscules (CapsLock).
* **⚔️ Commandes de Modération Natives :** Intégration complète via les *Slash Commands* de Discord (Avertissements cumulatifs, exclusions temporaires, kick, ban).
* **⚙️ Outils d'Administration :** Système de nettoyage intelligent (`/clear`) sécurisé par une double confirmation, et système d'auto-attribution de rôles par réactions (`/react`).
* **📢 Notifications Externes :** Scanners automatisés toutes les 5 minutes connectés aux APIs de **Twitch** (Helix) et **YouTube (v3)** pour annoncer les streams et vidéos en direct.

---

## 📁 Architecture du Projet

Le projet a été restructuré pour éviter un fichier monolithique, décomposant chaque commande dans son propre module :

```text
upfox-bot/
├── .github/              # Workflows d'intégration continue / CI-CD
├── commands/             # Répertoire des commandes modulaires (Command Handler)
│   ├── public/           # Commandes ouvertes à tous (hello, roll, uphelp)
│   ├── moderation/       # Commandes réservées aux modérateurs (warn, mute, kick...)
│   └── admin/            # Commandes critiques réservées aux administrateurs (clear, react...)
├── deploy-commands.js    # Script indépendant d'enregistrement des Slash Commands
├── index.js              # Point d'entrée principal (Gestion des événements et APIs)
├── package.json          # Configuration Node.js et dépendances du projet
└── .env                  # Fichier de configuration des variables d'environnement (Masqué)

```

---

## 🛠️ Installation et Configuration

### 1. Prérequis

* [Node.js](https://nodejs.org/) (Version 16.11.0 ou supérieure requise)
* Un compte développeur sur le [Discord Developer Portal](https://www.google.com/search?q=https://discord.com/developers/applications)

### 2. Clonage et Installation des dépendances

```bash
git clone [https://github.com/votre-utilisateur/upfox-bot.git](https://github.com/votre-utilisateur/upfox-bot.git)
cd upfox-bot
npm install

```

### 3. Variables d'environnement

Créez un fichier `.env` à la racine du projet et complétez les variables suivantes :

```env
DISCORD_TOKEN=votre_token_secret_discord
DISCORD_CLIENT_ID=id_unique_de_votre_application_discord

TWITCH_CLIENT_ID=votre_client_id_twitch
TWITCH_CLIENT_SECRET=votre_client_secret_twitch
TWITCH_CHANNEL_NAME=nom_de_la_chaine_twitch

YOUTUBE_API_KEY=votre_cle_api_google_cloud
YOUTUBE_CHANNEL_ID=id_de_la_chaine_youtube

PORT=3000

```

---

## 🚦 Utilisation

### Enregistrement des Raccourcis (Slash Commands)

Avant de lancer le bot pour la première fois ou suite à l'ajout d'une nouvelle commande, vous devez forcer la synchronisation des commandes auprès de l'API de Discord :

```bash
node deploy-commands.js

```

### Lancement du Bot

Pour démarrer l'application principale :

```bash
npm start

```

*Note : Le projet intègre un serveur HTTP Keep-Alive minimaliste sur le port spécifié, facilitant son hébergement permanent 24/7 sur des plateformes de type Cloud (Render, Railway, etc.).*

---

## 🔒 Sécurité & Permissions

Le bot utilise le système de permissions natif de Discord (`setDefaultMemberPermissions`).

* Les commandes de la catégorie **Modération** requièrent la permission `ManageMessages`.
* Les commandes de la catégorie **Admin** (comme `/clear`) requièrent explicitement les privilèges `Administrator`.

Les utilisateurs ne possédant pas ces droits se verront automatiquement masqués l'accès à ces raccourcis directement depuis l'interface de leur application Discord.

---

## 🎓 Contexte Pédagogique

Ce projet a été réalisé et restructuré dans le cadre d'un apprentissage des architectures événementielles et asynchrones en JavaScript (Node.js), en appliquant les bonnes pratiques de programmation enseignées en **BUT Informatique**.

manque le réact d'émoji par un autre
manque le /message
Plus diviser les fonctionnalités du bots en dossier
dossier (event / modération / live & youtube)
youtube automatique ?
centrée les données dans un json ?
/rajouter insulte dans un dictionnaire json