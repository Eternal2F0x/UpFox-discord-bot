// #region 1. CONFIGURATION INITIALE & LOGICIELLE
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const http = require('http');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.GuildMember,
        Partials.User,
        Partials.Message,
        Partials.Reaction
    ]
});

const PREFIX = '!';
// #endregion

// #region 2. PARAMÈTRES DE CONFIGURATION DES SALONS & CONSTANTES
const ID_SALON_BIENVENUE = "1408157176316559420";
const ID_SALON_ANNONCES = "1407775485093478593"; 
const ID_SALON_LOGS_MODERATION = "1407801890380709939";

// Liste des mots interdits pour l'auto-modération
const MOTS_INTERDITS = ["nigger", "fils de pute", "connard", "merde"]; // ⚠️ Complète cette liste avec les mots proscrits
// #endregion

// #region 3. STRUCTURES DE DONNÉES EN MÉMOIRE (STATE)
let twitchIsLive = false; 

// Base de données temporaire pour les avertissements accumulés (Key: userId, Value: entier)
const warnDatabase = new Map();

// Listes d'immunités pour l'Auto-Mod (Modifiables via !whitelist / !unwhitelist)
const ROLES_IMMUNISES = new Set(); 
const MEMBRES_IMMUNISES = new Set(); 

// Anti-Spam (Key: userId, Value: Array de timestamps)
const antiSpamMap = new Map();
const LIMITE_SPAM_MESSAGES = 4; // Nombre maximal de messages autorisés
const LIMITE_SPAM_TEMPS = 4000;  // Dans une fenêtre glissante de 4000 ms (4 secondes)
// #endregion

// #region 4. SERVEUR HTTP FANTÔME (KEEP-ALIVE RENDER)
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot UpFox en ligne ! ⚔️');
}).listen(process.env.PORT || 3000, () => {
    console.log(`🌐 Serveur fantôme Render activé sur le port ${process.env.PORT || 3000}`);
});
// #endregion

// #region 5. FONCTIONS DE SERVICES APIS (TWITCH / GOOGLE)
/**
 * Récupère le token d'accès OAuth2 auprès de l'API Twitch Identity
 */
async function getTwitchAccessToken() {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error("Erreur lors de la récupération du token Twitch :", error.message);
        return null;
    }
}
// #endregion

// #region 6. ÉVÉNEMENT : INITIALISATION & AUTOMATE TWITCH
client.once('clientReady', () => {
    console.log(`🤖 Bot connecté avec succès en tant que ${client.user.tag}!`);
    console.log("⏱️ [Automate] Boucle de vérification Twitch initialisée.");
    
    setInterval(async () => {
        console.log("🔄 [Automate] Vérification du statut Twitch en cours...");
        try {
            const channelName = process.env.TWITCH_CHANNEL_NAME;
            const token = await getTwitchAccessToken();
            
            if (!token) {
                console.log("❌ [Automate] Échec de la vérification : Impossible d'obtenir le token.");
                return;
            }

            const response = await axios.get(`https://api.twitch.tv/helix/streams`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                },
                params: { user_login: channelName }
            });

            const streamData = response.data.data;

            let salonAnnonces = client.channels.cache.get(ID_SALON_ANNONCES);
            if (!salonAnnonces) {
                salonAnnonces = await client.channels.fetch(ID_SALON_ANNONCES);
            }

            if (streamData && streamData.length > 0) {
                console.log(`📡 [Automate] Twitch détecte que ${channelName} est en LIVE !`);
                
                if (!twitchIsLive) { 
                    twitchIsLive = true; 
                    
                    const live = streamData[0];
                    const thumbnailUrl = live.thumbnail_url.replace('{width}', '1280').replace('{height}', '720');

                    const embed = new EmbedBuilder()
                        .setColor('#6441a5')
                        .setTitle(`🎮 ALERTE LIVE : ${channelName} est en stream !`)
                        .setURL(`https://twitch.tv/${channelName}`)
                        .setDescription(`**Titre :** ${live.title}\n**Jeu :** ${live.game_name}`)
                        .setImage(thumbnailUrl)
                        .setTimestamp();

                    await salonAnnonces.send({ content: "<@&1408165714757550130> Le clan est en live ! ⚔️", embeds: [embed] });
                    console.log("✅ [Automate] Message d'alerte envoyé sur Discord !");
                } else {
                    console.log("ℹ️ [Automate] Le live est toujours en cours, alerte déjà envoyée.");
                }
            } else {
                console.log(`💤 [Automate] ${channelName} est hors ligne.`);
                twitchIsLive = false; 
            }

        } catch (error) {
            console.error("❌ [Automate] Erreur lors de la vérification automatique :", error.message);
        }
    }, 300000); // 5 minutes
});
// #endregion

// #region 7. ÉVÉNEMENTS : GESTION DES FLUX DE MEMBRES (ACCUEIL)
client.on('guildMemberAdd', async (member) => {
    try {
        const salon = member.guild.channels.cache.get(ID_SALON_BIENVENUE);
        if (!salon) return;
        await salon.send(`Bienvenue dans le clan ${member} ! 🎉 Prend une chope 🍺 et profite.`);
    } catch (error) {
        console.error("Erreur lors de l'envoi du message de bienvenue :", error);
    }
});

client.on('guildMemberRemove', async (member) => {
    try {
        const salon = member.guild.channels.cache.get(ID_SALON_BIENVENUE);
        if (!salon) return;
        const nomUtilisateur = member.user ? member.user.username : "Un membre";
        await salon.send(`Oh, ${nomUtilisateur} a quitté le clan. 😢 Il n'était pas assez digne ⚔️`);
    } catch (error) {
        console.error("Erreur lors de l'envoi du message de départ :", error.message);
    }
});
// #endregion

// #region 8. ÉVÉNEMENT CENTRAL : TRAITEMENT DES MESSAGES
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const hasManageMessages = message.member.permissions.has(PermissionFlagsBits.ManageMessages);

    // ==========================================================
    // 🛡️ SUB-SECTION : MOTEUR D'AUTO-MODÉRATION PASSIVE
    // ==========================================================
    
    // Évaluation des privilèges d'invulnérabilité
    const aRoleImmunise = message.member.roles.cache.some(role => ROLES_IMMUNISES.has(role.id));
    const estMembreImmunise = MEMBRES_IMMUNISES.has(message.author.id);

    // Si le membre n'est ni modérateur, ni immunisé par rôle ou ID, on lance les filtres
    if (!hasManageMessages && !aRoleImmunise && !estMembreImmunise) {
        let raisonSanction = null;
        const texteBrut = message.content.trim();

        // ANALYSE 1 : Détection des insultes et vocabulaire proscrit
        const messageNormalise = texteBrut.toLowerCase();
        const contientInsulte = MOTS_INTERDITS.some(mot => messageNormalise.includes(mot));
        if (contientInsulte) {
            raisonSanction = "Langage vulgaire / Mots interdits";
        }

        // ANALYSE 2 : Détection de l'abus de majuscules (CAPSLOCK)
        if (!raisonSanction && texteBrut.length > 10) {
            const countMajuscules = texteBrut.replace(/[^A-Z]/g, "").length;
            const countLettresTotales = texteBrut.replace(/[^a-zA-Z]/g, "").length;

            if (countLettresTotales > 0 && (countMajuscules / countLettresTotales) > 0.70) {
                raisonSanction = "Abus de lettres capitales (CAPSLOCK)";
            }
        }

        // ANALYSE 3 : Détection de spam (Algorithme par fenêtre temporelle)
        if (!raisonSanction) {
            const maintenant = Date.now();
            if (!antiSpamMap.has(message.author.id)) {
                antiSpamMap.set(message.author.id, []);
            }

            const historiqueTimestamps = antiSpamMap.get(message.author.id);
            historiqueTimestamps.push(maintenant);

            // Filtrage des messages pour ne conserver que les plus récents dans la zone critique
            const messagesRecents = historiqueTimestamps.filter(t => maintenant - t < LIMITE_SPAM_TEMPS);
            antiSpamMap.set(message.author.id, messagesRecents);

            if (messagesRecents.length > LIMITE_SPAM_MESSAGES) {
                raisonSanction = "Spam rapide / Flux de messages excessif";
            }
        }

        // ACTION DE SANCTION ET CRÉATION DU LOG PRIVÉ STAFF
        if (raisonSanction) {
            await message.delete().catch(() => {});

            const alertePublique = await message.channel.send(`⚠️ ${message.author}, votre message a été supprimé. Motif : **${raisonSanction}**.`);
            setTimeout(() => alertePublique.delete().catch(() => {}), 6000);

            try {
                let salonLogs = message.guild.channels.cache.get(ID_SALON_LOGS_MODERATION);
                if (!salonLogs) salonLogs = await message.guild.channels.fetch(ID_SALON_LOGS_MODERATION);

                if (salonLogs) {
                    const embedLog = new EmbedBuilder()
                        .setColor('#ff3333')
                        .setTitle('🛡️ Système Auto-Mod : Message intercepté')
                        .setTimestamp()
                        .addFields(
                            { name: '👤 Utilisateur', value: `${message.author} (${message.author.tag})`, inline: true },
                            { name: '📍 Salon', value: `${message.channel}`, inline: true },
                            { name: '🚨 Motif de suppression', value: `\`${raisonSanction}\`` },
                            { name: '📝 Contenu effacé', value: texteBrut.length > 1024 ? `${texteBrut.substring(0, 1020)}...` : `*${texteBrut}*` }
                        );
                    await salonLogs.send({ embeds: [embedLog] });
                }
            } catch (err) {
                console.error("Échec d'envoi du log d'auto-modération :", err.message);
            }
            return; // Interruption immédiate du traitement pour ce message
        }
    }

    // ==========================================================
    // 🎭 SUB-SECTION : MODULES COMPORTEMENTAUX ET RÉACTIONS AUTOMATIQUES
    // ==========================================================
    const emojiPanneau = "<:Happy_sign:1514169900179128380>";
    if (message.content.includes(emojiPanneau)) {
        try {
            await message.react(emojiPanneau);
        } catch (error) {
            console.error("Impossible de réagir avec l'émoji :", error);
        }
    }

    // Interruption si le message ne commence pas par le préfixe configuré
    if (!message.content.startsWith(PREFIX)) return;

    // Découpage sémantique des arguments et de la commande
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ==========================================================
    // 👤 SUB-SECTION : COMMANDES PUBLIQUES (TOUS UTILISATEURS)
    // ==========================================================
    if (command === 'hello') {
        return message.channel.send(`Salut ${message.author.username} alias ${message.author.displayName} !👋`);
    }

    if (command === 'roll') {
        const resultatDe = Math.floor(Math.random() * 6) + 1;
        return message.reply(`🎲 Tu as lancé un dé et tu as obtenu un **${resultatDe}** !`);
    }

    if (command === 'twitch') {
        try {
            const channelName = process.env.TWITCH_CHANNEL_NAME;
            const twitchUrl = `https://twitch.tv/${channelName}`;
            
            const token = await getTwitchAccessToken();
            if (!token) return message.reply("❌ Impossible de se connecter à l'API Twitch actuellement.");

            const response = await axios.get(`https://api.twitch.tv/helix/streams`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                },
                params: { user_login: channelName }
            });

            const streamData = response.data.data;
            const embed = new EmbedBuilder().setColor('#6441a5');

            if (streamData && streamData.length > 0) {
                const live = streamData[0];
                const thumbnailUrl = live.thumbnail_url.replace('{width}', '1280').replace('{height}', '720');

                embed.setTitle(`🟣 Je suis en LIVE sur Twitch !`)
                     .setDescription(`**Titre :** ${live.title}\n**Jeu :** ${live.game_name}\n**Spectateurs :** ${live.viewer_count} 👥`)
                     .setURL(twitchUrl)
                     .setImage(thumbnailUrl);
            } else {
                embed.setTitle(`⚫ Chaîne Twitch de ${channelName}`)
                     .setDescription(`Je ne suis pas en live pour le moment. Rejoins la communauté pour ne pas rater le prochain stream !`)
                     .setURL(twitchUrl);
            }
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Erreur lors de la commande !twitch :", error.message);
            return message.reply("⚠️ Une erreur est survenue lors de la récupération des informations Twitch.");
        }
    }

    if (command === 'youtube') {
        try {
            const apiKey = process.env.YOUTUBE_API_KEY;
            const channelId = process.env.YOUTUBE_CHANNEL_ID;

            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    key: apiKey,
                    channelId: channelId,
                    part: 'snippet',
                    order: 'date',
                    maxResults: 1,
                    type: 'video'
                }
            });

            const videos = response.data.items;
            if (!videos || videos.length === 0) {
                return message.reply("📺 Aucune vidéo publique n'a été trouvée sur cette chaîne YouTube.");
            }

            const latestVideo = videos[0];
            const videoUrl = `https://www.youtube.com/watch?v=${latestVideo.id.videoId}`;

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`🔴 Nouvelle vidéo YouTube : ${latestVideo.snippet.title}`)
                .setURL(videoUrl)
                .setDescription(`Découvre notre tout dernier contenu fraîchement publié sur la chaîne !`)
                .setImage(latestVideo.snippet.thumbnails.high.url);

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Erreur lors de la commande !youtube :", error.message);
            return message.reply("⚠️ Une erreur est survenue lors de la récupération de la vidéo YouTube.");
        }
    }

    // ==========================================================
    // ⚔️ SUB-SECTION : COMMANDES DE MODÉRATION & CONFIG AUTOMOD (STAFF)
    // ==========================================================
    if (!hasManageMessages) return; // Sécurité de garde d'accès pour les modérateurs

    // CONFIGURATION D'IMMUNITÉ : AJOUT (!whitelist)
    if (command === 'whitelist') {
        const type = args[0]; 
        const targetId = args[1];

        if (!type || !targetId) {
            return message.reply("❌ Erreur de syntaxe. Exemples :\n`!whitelist role <ID_ROLE>`\n`!whitelist user <ID_USER>`");
        }

        if (type === 'role') {
            ROLES_IMMUNISES.add(targetId);
            message.channel.send(`🛡️ Le rôle \`${targetId}\` est désormais **immunisé** contre les contrôles de l'Auto-Mod.`);
        } else if (type === 'user') {
            MEMBRES_IMMUNISES.add(targetId);
            message.channel.send(`🛡️ L'utilisateur \`${targetId}\` est désormais **immunisé** contre les contrôles de l'Auto-Mod.`);
        } else {
            return message.reply("❌ Type non reconnu. Utilisez `role` ou `user`.");
        }
        return message.delete().catch(() => {});
    }

    // CONFIGURATION D'IMMUNITÉ : RETRAIT (!unwhitelist)
    if (command === 'unwhitelist') {
        const type = args[0];
        const targetId = args[1];

        if (!type || !targetId) {
            return message.reply("❌ Erreur de syntaxe. Exemples :\n`!unwhitelist role <ID_ROLE>`\n`!unwhitelist user <ID_USER>`");
        }

        if (type === 'role') {
            if (ROLES_IMMUNISES.delete(targetId)) {
                message.channel.send(`⚠️ Le rôle \`${targetId}\` a perdu ses droits d'immunité.`);
            } else {
                message.reply("❌ Cet ID de rôle ne figure pas dans la liste des immunités.");
            }
        } else if (type === 'user') {
            if (MEMBRES_IMMUNISES.delete(targetId)) {
                message.channel.send(`⚠️ L'utilisateur \`${targetId}\` a perdu ses droits d'immunité.`);
            } else {
                message.reply("❌ Cet ID utilisateur ne figure pas dans la liste des immunités.");
            }
        }
        return message.delete().catch(() => {});
    }

    // COMMANDE DE SIGNALEMENT / AVERTISSEMENT (!warn)
    if (command === 'warn') {
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Syntaxe : `!warn @Pseudo [Raison]`");
        
        const raison = args.slice(1).join(' ') || "Aucune raison spécifiée";
        
        let countWarns = warnDatabase.get(cible.id) || 0;
        countWarns++;
        warnDatabase.set(cible.id, countWarns);

        message.channel.send(`⚠️ **${cible.displayName}** a reçu un avertissement pour : *${raison}* (${countWarns}/3).`);
        
        if (countWarns >= 3) {
            if (cible.kickable) {
                await cible.kick("Accumulation de 3 avertissements.");
                message.channel.send(`🚨 **${cible.displayName}** a été expulsé du serveur pour accumulation d'avertissements.`);
                warnDatabase.set(cible.id, 0);
            }
        }
        return message.delete().catch(() => {});
    }

    // ANNULATION D'AVERTISSEMENT (!unwarn)
    if (command === 'unwarn') {
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Syntaxe : `!unwarn @Pseudo`");

        let countWarns = warnDatabase.get(cible.id) || 0;
        if (countWarns > 0) countWarns--;
        warnDatabase.set(cible.id, countWarns);

        return message.reply(`✅ Avertissement révoqué pour **${cible.displayName}** (Total actuel : ${countWarns}).`);
    }

    // REDUCTION AU SILENCE TEMPORAIRE (!mute)
    if (command === 'mute') {
        const cible = message.mentions.members.first();
        const minutes = parseInt(args[1]);
        const raison = args.slice(2).join(' ') || "Pas de raison spécifiée";

        if (!cible || isNaN(minutes)) {
            return message.reply("❌ Syntaxe : `!mute @Pseudo <minutes> [raison]`");
        }

        try {
            await cible.timeout(minutes * 60 * 1000, raison);
            message.channel.send(`🔇 **${cible.displayName}** a été exclu temporairement pendant **${minutes}** minutes. Motif : *${raison}*`);
            return message.delete().catch(() => {});
        } catch (error) {
            return message.reply("❌ Action impossible : Hiérarchie de rôles insuffisante.");
        }
    }

    // RESTAURATION DE LA PAROLE (!unmute)
    if (command === 'unmute') {
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Syntaxe : `!unmute @Pseudo`");

        try {
            await cible.timeout(null);
            return message.channel.send(`🔊 **${cible.displayName}** a récupéré l'autorisation de parler.`);
        } catch (error) {
            return message.reply("❌ Impossible de supprimer l'exclusion temporelle de ce membre.");
        }
    }

    // EXPULSION SÉCURISÉE (!kick)
    if (command === 'kick') {
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Syntaxe : `!kick @Pseudo [raison]`");
        if (!cible.kickable) return message.reply("❌ Droits insuffisants vis-à-vis de la hiérarchie de ce membre.");

        const raison = args.slice(1).join(' ') || "Aucune raison spécifiée";
        await cible.kick(raison);
        return message.channel.send(`🚨 **${cible.displayName}** a été expulsé. Motif : *${raison}*`);
    }

    // BANNISSEMENT DÉFINITIF (!ban)
    if (command === 'ban') {
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Syntaxe : `!ban @Pseudo [raison]`");
        if (!cible.bannable) return message.reply("❌ Droits insuffisants vis-à-vis de la hiérarchie de ce membre.");

        const raison = args.slice(1).join(' ') || "Aucune raison spécifiée";
        await cible.ban({ reason: raison });
        return message.channel.send(`🔨 **${cible.displayName}** a été banni définitivement. Motif : *${raison}*`);
    }

    // TRANSMISSION FORCÉE DE MESSAGE PAR LE BOT (!message)
    if (command === 'message') {
        const salonCible = message.mentions.channels.first();
        args.shift();
        const texteAEnvoyer = args.join(' ');

        if (!salonCible || !texteAEnvoyer) {
            return message.reply("❌ Syntaxe incorrecte. Exemple : `!message #salon Votre texte`.");
        }

        try {
            await message.reply(`${message.member.displayName} : ${texteAEnvoyer} sur ${salonCible}`);
            await salonCible.send(texteAEnvoyer);
            await message.delete();
        } catch (error) {
            console.error("Erreur lors de l'envoi du message forcé :", error);
        }
    }

    // CONFIGURATION DES RÉACTIONS DE RÔLES REACTIONROLE (!react)
    if (command === 'react') {
        const salonCible = message.mentions.channels.first();
        args.shift();

        const idMessage = args[0];
        const emojiBrut = args[1];
        const roleCible = message.mentions.roles.first();

        if (!salonCible || !idMessage || !emojiBrut || !roleCible) {
            return message.reply("❌ Syntaxe incorrecte. Exemple : `!react #salon ID_MESSAGE :emoji: @Role`");
        }

        try {
            const messageCible = await salonCible.messages.fetch(idMessage);
            await messageCible.react(emojiBrut);

            const filtre = (reaction, user) => reaction.emoji.name === emojiBrut || reaction.emoji.toString() === emojiBrut;
            const collector = messageCible.createReactionCollector({ filtre, dispose: true });

            collector.on('collect', async (reaction, user) => {
                if (user.bot) return;
                try {
                    const membre = await message.guild.members.fetch(user.id);
                    await membre.roles.add(roleCible);
                    console.log(`Rôle ${roleCible.name} ajouté à ${membre.displayName}`);
                } catch (err) {
                    console.error("Erreur lors de l'ajout du rôle :", err);
                }
            });

            collector.on('remove', async (reaction, user) => {
                if (user.bot) return;
                try {
                    const membre = await message.guild.members.fetch(user.id);
                    await membre.roles.remove(roleCible);
                    console.log(`Rôle ${roleCible.name} retiré à ${membre.displayName}`);
                } catch (err) {
                    console.error("Erreur lors du retrait du rôle :", err);
                }
            });

            await message.reply(`✅ Système de Reaction Role configuré avec succès sur le message dans ${salonCible} !`);
            await message.delete();

        } catch (error) {
            console.error("Erreur lors de la configuration du !react :", error);
            message.reply("❌ Impossible de configurer le système. Vérifie l'ID du message.");
        }
    }

    // ==========================================================
    // 👑 SUB-SECTION : COMMANDES RÉSERVÉES AUX ADMINISTRATEURS
    // ==========================================================
    const isServerAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);

    if (command === 'muteall') {
        if (!isServerAdmin) return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
            await message.channel.send("🔒 **Le salon a été verrouillé.** Écriture désactivée pour le rôle @everyone.");
            await message.delete().catch(() => {});
        } catch (error) {
            console.error(error);
            message.reply("❌ Impossible de modifier les permissions du salon.");
        }
    }

    if (command === 'unmuteall') {
        if (!isServerAdmin) return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");
        try {
            await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: null });
            await message.channel.send("🔓 **Le salon a été déverrouillé.** Écriture réactivée pour le rôle @everyone.");
            await message.delete().catch(() => {});
        } catch (error) {
            console.error(error);
            message.reply("❌ Impossible de restaurer les permissions du salon.");
        }
    }

    if (command === 'clear') {
        if (!isServerAdmin) return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");

        const nombreDeMessages = parseInt(args[0]);
        if (isNaN(nombreDeMessages) || nombreDeMessages < 1 || nombreDeMessages > 99) {
            return message.reply("❌ Indiquez un nombre entre 1 et 99. Exemple : `!clear 10`.");
        }

        const messageDemande = await message.reply(`⚠️ Confirmez la suppression de **${nombreDeMessages}** messages avec \`!ok\` ou \`!cancel\`.`);

        const filtreConfirmation = response => response.author.id === message.author.id && ['!ok', '!cancel'].includes(response.content.toLowerCase());
        const collector = message.channel.createMessageCollector({ filter: filtreConfirmation, time: 15000, max: 1 });

        collector.on('collect', async (reponseMessage) => {
            if (reponseMessage.content.toLowerCase() === '!ok') {
                try {
                    const messagesDuSalon = await message.channel.messages.fetch({ limit: nombreDeMessages + 2 });
                    const limite14Jours = Date.now() - (14 * 24 * 60 * 60 * 1000);
                    const messagesSupprimables = messagesDuSalon.filter(msg => msg.createdTimestamp > limite14Jours);
                    const quantiteReelle = messagesSupprimables.size - 2;

                    if (messagesSupprimables.size > 0) {
                        await message.channel.bulkDelete(messagesSupprimables);
                    }

                    let texteConfirmation = `🗑️ **${quantiteReelle}** message(s) ont été nettoyés.`;
                    if (quantiteReelle < nombreDeMessages) {
                        texteConfirmation += ` *(Les messages de plus de 14 jours ont été ignorés).*`;
                    }

                    const confirmation = await message.channel.send(texteConfirmation);
                    setTimeout(() => confirmation.delete().catch(() => {}), 5000);
                } catch (error) {
                    console.error(error);
                    message.channel.send("❌ Erreur lors de l'exécution du nettoyage.");
                }
            } else {
                await messageDemande.edit("❌ Suppression annulée.");
                await reponseMessage.delete().catch(() => {});
                setTimeout(() => messageDemande.delete().catch(() => {}), 3000);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                messageDemande.edit("⏱️ Temps écoulé. Suppression automatique annulée.").catch(() => {});
                setTimeout(() => messageDemande.delete().catch(() => {}), 3000);
            }
        });
    }
});
// #endregion

// #region 9. SÉCURITÉ GLOBO-SYSTÈME & CONNEXION
process.on('unhandledRejection', error => {
    console.error('\n[ERREUR CAPTURÉE] Trace système :');
    console.error(error.message);
});

client.login(process.env.DISCORD_TOKEN);
// #endregion