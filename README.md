# 🤖 Bot Discord de Gestion de Clan

Un bot Discord polyvalent développé en **JavaScript** avec **Node.js** et la bibliothèque **Discord.js (v14)**. Ce bot est conçu pour animer, modérer et gérer de manière automatisée un serveur Discord communautaire.

Dans le cadre d'une démarche d'apprentissage en **BUT Informatique**, ce projet met l'accent sur les bonnes pratiques de développement, la sécurité des données sensibles et l'automatisation du déploiement via l'intégration continue (CI/CD).

---

## 🚀 Fonctionnalités

### 🎉 Accueil & Communauté
* **Souhaits de bienvenue :** Envoie automatiquement un message d'accueil personnalisé dans un salon spécifique à l'arrivée d'un nouveau membre.
* **Messages de départ :** Signale le départ d'un membre avec humour.

### 🎮 Divertissement & Intégrations
* `!hello` : Salue l'utilisateur en affichant son pseudonyme et son nom d'affichage global.
* `!roll` : Simule le lancer d'un dé à 6 faces (`🎲 Résultat : 1 à 6`).
* **Réactions automatiques :** Ajoute automatiquement une réaction émoji personnalisée sous chaque message contenant l'émoji cible défini.

### 🛡️ Modération & Administration (Réservé aux Modérateurs)
* `!message #salon <texte>` : Permet à un modérateur d'envoyer un message officiel anonymisé dans le salon textuel de son choix.
* `!react #salon <ID_Message> :emoji: @Role` : Configure un système de **Reaction Role**. Les utilisateurs qui cliquent sur la réaction reçoivent le rôle, et le rôle leur est retiré s'ils l'enlèvent.
* `!muteAll` : Verrouille le salon textuel actuel en retirant la permission d'écrire au rôle `@everyone`.
* `!unmuteAll` : Déverrouille le salon textuel actuel.
* `!clear <1-99>` : Supprime en masse un nombre défini de messages récents (avec système de confirmation de sécurité `!ok` / `!cancel` et protection contre le crash des messages de plus de 14 jours).

---

## 🔒 Sécurité & Bonnes Pratiques

Ce projet applique strictement le principe du **Zéro Confiance** :
1. **Masquage des Secrets :** Le jeton privé du bot (`DISCORD_TOKEN`) n'est jamais écrit en dur dans le code. Il est stocké localement dans un fichier `.env` et configuré à distance via les **GitHub Secrets**.
2. **Ignorance de fichiers (.gitignore) :** Le dossier lourd `node_modules/` et le fichier sensible `.env` sont explicitement exclus du suivi de version Git pour éviter toute fuite accidentelle sur Internet.
3. **Principe du Moindre Privilège :** Le bot ne possède pas la permission générale *Administrateur*. Ses droits sont limités aux permissions strictes requises par son code (`Envoyer des messages`, `Gérer les messages`, `Gérer les rôles`, etc.).
4. **Gestion de la Robustesse :** Utilisation intensive de blocs `try / catch` et écoute de l'événement système `unhandledRejection` pour capturer les exceptions et éviter les crashs inopinés de l'application.

---

## ⚙️ Déploiement Continu (H24 / 7j7)

Le bot est hébergé de manière automatisée et gratuite via **GitHub Actions** (CI/CD) sous un environnement virtuel `Ubuntu (Linux)`. 

Le workflow configuré dans `.github/workflows/bot.yml` réalise les actions suivantes :
* Se déclenche à chaque mise à jour (`git push`) sur la branche `main`.
* Installe l'environnement Node.js (v20) et télécharge les dépendances exactes via `npm ci` (grâce au fichier de verrouillage `package-lock.json`).
* S'exécute en continu et planifie un redémarrage transparent toutes les 5 heures via un déclencheur planifié (`cron`) pour contourner les limitations de temps des serveurs éphémères de GitHub.

---

## 🛠️ Installation en Local

Pour tester ou modifier ce projet sur votre ordinateur :

1. Clonez le dépôt :
   ```bash
   git clone [https://github.com/votre-pseudo/votre-repo.git](https://github.com/votre-pseudo/votre-repo.git)
   cd nom-du-dossier
2. npm install
3. dans un fichier .env :
   DISCORD_TOKEN=votre_token_secret_ici
4. node index.js
5. 
### Prochaine étape :
Une fois que tu as collé cela dans ton `README.md` et que ton fichier `.github/workflows/bot.yml` est créé, tu pourras faire ton premier push global en sécurité :
```bash
git add .
git commit -m "Mise au propre et documentation README"
git push ```