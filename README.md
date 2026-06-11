# 🦊 UpFox - Bot Discord Multi-Fonctions

UpFox est un bot Discord robuste développé en **JavaScript (Node.js)** avec la bibliothèque **Discord.js v14**. Conçu initialement pour la gestion d'un clan, il intègre un système moderne de **Slash Commands**, un moteur d'**auto-modération passive**, ainsi que des modules d'**automatisation d'alertes de streaming et de contenu vidéo**.

---

## 🚀 Fonctionnalités Clés

### 💻 Commandes Intuitives (Slash Commands)
Bénéficie de l'autocomplétion native de Discord pour une meilleure expérience utilisateur :
* `/uphelp` : Affiche le centre d'aide dynamique en mode éphémère (visible uniquement par l'appelant) trié selon les permissions de l'utilisateur.
* `/hello` : Salue l'utilisateur de manière interactive.
* `/roll` : Simule le lancer d'un dé à 6 faces.

### 🛡️ Système d'Auto-Modération & Sécurité
Un moteur passif analyse chaque message envoyé sur le serveur (hors modérateurs et membres immunisés) :
* **Filtre anti-insultes** : Suppression automatique des messages contenant des mots proscrits avec avertissement public temporaire.
* **Détection d'abus de majuscules** : Interception des messages contenant plus de 70% de lettres capitales (CAPSLOCK).
* **Algorithme Anti-Spam** : Bloque les flux de messages excessifs basés sur une fenêtre glissante temporelle (max 4 messages en 4 secondes).
* **Logs dédiés** : Envoi automatique d'un rapport détaillé (Embed complet avec contexte, auteur, salon et contenu effacé) dans un salon de logs privé.

### ⚔️ Gestion du Staff & Modération Textuelle (`!`)
* `!warn` / `!unwarn` : Gestion des avertissements cumulatifs (expulsion automatique au bout de 3 *warns*).
* `!mute` / `!unmute` : Exclusion temporelle d'un membre (*timeout* natif de Discord).
* `!kick` / `!ban` : Expulsion et bannissement définitif respectant la hiérarchie des rôles.
* `!whitelist` / `!unwhitelist` : Permet d'immuniser dynamiquement un rôle ou un utilisateur spécifique contre le moteur d'Auto-Mod.
* `!muteall` / `!unmuteall` : Verrouillage/Déverrouillage rapide d'un salon complet (gestion du rôle `@everyone`).

### 📡 Automatisation & Connecteurs APIs Externes
* **Automate Twitch** : Vérification asynchrone toutes les 5 minutes du statut d'une chaîne Twitch (via protocole OAuth2 et API Helix). Envoi automatique d'un Embed d'alerte avec miniature dynamique lors du passage en LIVE.
* **Module YouTube** : Récupération de la dernière vidéo publiée sur une chaîne via l'API Google v3 YouTube Data.
* **Reaction Role (`!react`)** : Collecteur d'interactions persistant permettant d'attribuer ou de retirer un rôle de manière automatisée lors de l'ajout/retrait d'une réaction.

---

## 🛠️ Pile Technologique (Tech Stack)

* **Environnement d'exécution** : Node.js (v16.x ou supérieure)
* **Bibliothèque principale** : Discord.js v14
* **Requêtes HTTP & APIs REST** : Axios
* **Hébergement & Keep-Alive** : Serveur HTTP natif inclus pour assurer le *ping* de maintien en ligne (idéal pour des plateformes comme Render).

---

## ⚙️ Configuration et Installation

### 1. Prérequis
Assure-toi d'avoir installé Node.js sur ton environnement de développement.

### 2. Clonage et installation des dépendances
```bash
git clone <url-de-ton-depot>
cd upfox-bot
npm install
3. Variables d'environnement (.env)
Crée un fichier .env à la racine de ton projet et renseigne les jetons d'accès et identifiants requis :

Extrait de code
# Discord Configuration
DISCORD_TOKEN=ton_token_de_bot_discord

# Twitch API Configuration
TWITCH_CLIENT_ID=ton_client_id_twitch
TWITCH_CLIENT_SECRET=ton_client_secret_twitch
TWITCH_CHANNEL_NAME=nom_de_la_chaine_twitch

# YouTube API Configuration
YOUTUBE_API_KEY=ta_cle_api_google_youtube
YOUTUBE_CHANNEL_ID=id_de_la_chaine_youtube

# Network (Optionnel pour Render)
PORT=3000
4. Configuration des salons (dans index.js)
Pense à modifier les identifiants de salons uniques au début du fichier index.js pour correspondre à ton serveur Discord de production :

JavaScript
const ID_SALON_BIENVENUE = "1408157176316559420";
const ID_SALON_ANNONCES = "1407775485093478593"; 
const ID_SALON_LOGS_MODERATION = "1407801890380709939";
🚀 Lancement
Pour démarrer le bot en mode production :

Bash
node index.js
Au démarrage, le bot va automatiquement enregistrer et actualiser son registre de Slash Commands auprès de l'API de Discord Gateway. Tu devrais voir apparaître les confirmations suivantes dans ta console :

Plaintext
🌐 Serveur fantôme Render activé sur le port 3000
🔄 Enregistrement des Slash Commands auprès de Discord...
✅ Slash Commands enregistrées avec succès !
🤖 Bot connecté avec succès en tant que UpFox#1234!
⏱️ [Automate] Boucle de vérification Twitch initialisée.
🧑‍💻 Architecture du Code
Le projet est architecturé de manière monolithique mais structuré proprement en régions (#region) sémantiques permettant une maintenance aisée :

Configuration Initiale & Enregistrement API REST

Paramètres et Constantes des Salons

Structures de données en mémoire vive (State)

Serveur HTTP Keep-Alive

Couche Services d'intégration APIs

Événements de cycle de vie (ready)

Événements de flux de membres (guildMemberAdd, guildMemberRemove)

Événement central des messages textuels (messageCreate)

Gestion globale des exceptions système (Unhandled Rejections)

Gestionnaire d'interactions d'interface utilisateur (interactionCreate)
""");