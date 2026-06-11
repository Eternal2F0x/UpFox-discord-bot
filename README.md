# 🦊 UpFox Discord Bot — Documentation Finale (V2)

UpFox est un bot Discord autonome et polyvalent développé dans le cadre d'un apprentissage pratique en **BUT Informatique (1ère année)**. Il centralise des fonctionnalités communautaires et intègre un puissant moteur d'**Auto-Modération centralisé avec logs et immunités dynamiques**, calqué sur les standards de bots professionnels comme *DraftBot*.

---

## 📂 Organisation du Code Source (`index.js`)

Le script principal est structuré en **9 régions sémantiques distinctes** pour assurer une lisibilité et une maintenance optimales (dépliables/pliables via les balises `// #region` dans votre IDE) :

1.  **`1. CONFIGURATION INITIALE & LOGICIELLE` :** Chargement des variables cryptographiques d'environnement (`dotenv`) et instanciation du client Discord Client avec ses IntentBits et Partials associés.
2.  **`2. PARAMÈTRES DE CONFIGURATION DES SALONS & CONSTANTES` :** Déclaration centralisée des identifiants (IDs) des salons (Bienvenue, Annonces, Salon privé des Logs du Staff) et de la liste noire lexicale.
3.  **`3. STRUCTURES DE DONNÉES EN MÉMOIRE (STATE)` :** Déclaration des structures de stockage dynamique (Base de données des avertissements via `Map`, gestionnaires d'immunités via `Set`, historiques pour l'anti-spam).
4.  **`4. SERVEUR HTTP FANTÔME (KEEP-ALIVE RENDER)` :** Serveur d'écoute réseau natif Node.js pour valider le *Port Binding* sur l'infrastructure Cloud de Render et contrer la mise en veille automatique.
5.  **`5. FONCTIONS DE SERVICES APIS (TWITCH / GOOGLE)` :** Centralisation des requêtes asynchrones HTTP (`axios`) pour récupérer les tokens éphémères de sécurité OAuth2 de l'API Twitch Helix.
6.  **`6. ÉVÉNEMENT : INITIALISATION & AUTOMATE TWITCH` :** Lancement de l'écoute du bot et du planificateur récurrent (intervalle de 5 minutes) vérifiant le statut de streaming.
7.  **`7. ÉVÉNEMENTS : GESTION DES FLUX DE MEMBRES (ACCUEIL)` :** Hooks événementiels d'entrées (`guildMemberAdd`) et de sorties (`guildMemberRemove`) du serveur.
8.  **`8. ÉVÉNEMENT CENTRAL : TRAITEMENT DES MESSAGES` :** Le cœur du bot contenant le routeur d'Auto-Mod passive, les commandes d'immunités (Whitelist), les utilitaires de modération (Warn, Mute, Clear) et les fonctions publiques (Hello, Roll, Twitch, Youtube).
9.  **`9. SÉCURITÉ GLOBO-SYSTÈME & CONNEXION` :** Intercepteur global (`unhandledRejection`) empêchant l'application de crasher en cas de rejet de promesse asynchrone non capturé, suivi de l'initialisation de session par jeton (`client.login`).

---

## 🛡️ Spécifications du Moteur d'Auto-Modération

Le bot applique un contrôle passif sur l'ensemble des messages du serveur (sauf si l'auteur est un robot, un modérateur natif ou possède une immunité) :

* **Filtre Lexical (Insultes) :** Conversion du message au format minuscule (`.toLowerCase()`) et vérification d'inclusion d'un mot proscrit de la liste via la méthode JavaScript `.some()`.
* **Anti-CAPSLOCK (Abus de Majuscules) :** Filtrage sélectif du texte via l'expression régulière `/[^A-Z]/g` pour dénombrer les majuscules. Si le message fait plus de 10 caractères et contient plus de **70% de lettres capitales**, le message est intercepté.
* **Anti-Spam (Fenêtre Glissante) :** Stockage des timestamps UNIX (`Date.now()`) dans un tableau propre à chaque utilisateur. Le bot effectue une purge continue pour ne garder que les messages envoyés au cours des **4 dernières secondes**. Si un utilisateur atteint plus de **4 messages** dans cet intervalle, la sanction s'applique.

### 📝 Chaîne d'action lors d'une infraction :
1.  Suppression immédiate du message malveillant via `.delete()`.
2.  Envoi d'une alerte publique temporaire dans le salon textuel (auto-détruite après 6 secondes pour ne pas polluer l'espace communautaire).
3.  Envoi d'un rapport complet (`EmbedBuilder` rouge) dans le **salon privé de logs du staff**, spécifiant l'identité de l'auteur, l'ID, le salon concerné, le motif exact du blocage, ainsi qu'une copie du texte intercepté.

---

## ⚔️ Commandes de Modération & Immunités (Style DraftBot)

### 🛡️ Gestion de la Whitelist (Immunités)
* `!whitelist role <ID_ROLE>` : Ajoute un rôle complet à la liste des immunités.
* `!whitelist user <ID_USER>` : Ajoute un membre spécifique (par son ID) à la liste des immunités.
* `!unwhitelist role <ID_ROLE>` : Retire l'immunité d'un rôle.
* `!unwhitelist user <ID_USER>` : Retire l'immunité d'un membre.

*Note de BUT Informatique :* L'implémentation utilise des objets JavaScript `Set()` (au lieu d'un `Array`). Cela permet d'obtenir une complexité algorithmique optimale de **O(1)** lors de la vérification d'existence (`.has()`) au passage de chaque message.

### 🔨 Sanctions directes
* `!warn @membre [raison]` : Attribue un avertissement stocké dans une `Map`. À **3 warns**, le bot applique automatiquement un `kick` (expulsion) du membre.
* `!unwarn @membre` : Décrémente le compteur d'avertissements du membre ciblé.
* `!mute @membre <minutes> [raison]` : Applique une exclusion temporaire native Discord (*Timeout*) de la durée spécifiée.
* `!unmute @membre` : Révoque le timeout d'un membre de manière anticipée.
* `!kick @membre [raison]` : Expulse immédiatement le membre du serveur.
* `!ban @membre [raison]` : Bannit définitivement le membre du serveur.

### 🗑️ Utilitaires de salon
* `!clear <nombre>` : Demande la suppression de $X$ messages (entre 1 et 99). Le bot demande une confirmation de sécurité (`!ok` ou `!cancel`). Il intègre une sécurité excluant les messages de plus de 14 jours pour éviter les rejets de l'API Discord.
* `!muteAll` : *(Admin)* Verrouille l'écriture du salon textuel pour le rôle `@everyone`.
* `!unmuteAll` : *(Admin)* Restaure les permissions d'écriture par défaut du salon pour le rôle `@everyone`.

---

## 🔑 Variables d'Environnement Clés (Render.com)

Afin de respecter les exigences de sécurité fondamentales, les variables suivantes doivent être déclarées au sein du panneau de contrôle de l'hébergeur :
* `DISCORD_TOKEN` : Jeton d'authentification secret de l'application Discord Developer.
* `PORT` : Port réseau d'écoute (injecté automatiquement par Render, par défaut `3000`).
* `TWITCH_CLIENT_ID` & `TWITCH_CLIENT_SECRET` : Clés applicatives de la console Twitch Dev.
* `TWITCH_CHANNEL_NAME` : Nom exact de la chaîne à écouter (ex: `f0x_soul`).
* `YOUTUBE_API_KEY` & `YOUTUBE_CHANNEL_ID` : Paramètres d'accès aux services de données Google Cloud.