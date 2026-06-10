// #region Configuration du BOT
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

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
const ID_SALON_BIENVENUE = "1408157176316559420";
const ID_SALON_ANNONCES = "1407775485093478593"; // Ton salon d'annonces / NewsChannel

// Variables de mémoire pour éviter le spam des alertes automatiques
let twitchIsLive = false; 

/**
 * FONCTION UTILITAIRE : Récupérer le token d'accès OAuth2 de Twitch
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

// Événement au démarrage du bot (Mis à jour vers 'clientReady' pour Discord.js v14+)
client.once('clientReady', () => {
    console.log(`🤖 Bot connecté avec succès en tant que ${client.user.tag}!`);

    // 🔄 LANCEMENT DE L'AUTOMATE TWITCH (Vérification toutes les 5 minutes)
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

            // Requête Helix Twitch
            const response = await axios.get(`https://api.twitch.tv/helix/streams`, {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                },
                params: { user_login: channelName }
            });

            const streamData = response.data.data;

            // Récupération sécurisée du salon (Cache, sinon Fetch API)
            let salonAnnonces = client.channels.cache.get(ID_SALON_ANNONCES);
            if (!salonAnnonces) {
                salonAnnonces = await client.channels.fetch(ID_SALON_ANNONCES);
            }

            if (streamData && streamData.length > 0) {
                console.log(`📡 [Automate] Twitch détecte que ${channelName} est en LIVE !`);
                
                if (!twitchIsLive) { 
                    twitchIsLive = true; // On verrouille la mémoire pour ne pas spammer
                    
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
                twitchIsLive = false; // On réinitialise la mémoire quand le live coupe
            }

        } catch (error) {
            console.error("❌ [Automate] Erreur lors de la vérification automatique :", error.message);
        }
    }, 120000); // 120000 ms = 2 minutes
});
// #endregion

// #region Bonjour/aurevoir
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

        // Sécurité si le membre vient d'être banni/kick (données de cache incomplètes)
        const nomUtilisateur = member.user ? member.user.username : "Un membre";

        await salon.send(`Oh, ${nomUtilisateur} a quitté le clan. 😢 Il n'était pas assez digne ⚔️`);
    } catch (error) {
        console.error("Erreur lors de l'envoi du message de départ :", error.message);
    }
});
// #endregion

// #region Command et Réact
client.on('messageCreate', async (message) => {
    let admin = message.member.permissions.has(PermissionFlagsBits.ManageMessages);
    if (message.author.bot) return;

    // #region PARTIE AUTOMATIQUE (Exécution passive sur les messages)
    const emojiPanneau = "<:emoji_13:1513814609604120677>";

    if (message.content.includes(emojiPanneau)) {
        try {
            await message.react(emojiPanneau);
        } catch (error) {
            console.error("Impossible de réagir avec l'émoji :", error);
        }
    }
    // #endregion

    // #region PARTIE CLIENT (Accessibles à n'importe quel utilisateur)
    if (message.content === PREFIX + 'hello') {
        return message.channel.send(`Salut ${message.author.username} alias ${message.author.displayName} !👋`);
    }

    if (message.content === PREFIX + 'roll') {
        const resultatDe = Math.floor(Math.random() * 6) + 1;
        return message.reply(`🎲 Tu as lancé un dé et tu as obtenu un **${resultatDe}** !`);
    }

    // Commande manuelle !twitch
    if (message.content === PREFIX + 'twitch') {
        try {
            const channelName = process.env.TWITCH_CHANNEL_NAME;
            const twitchUrl = `https://twitch.tv/${channelName}`;
            
            const token = await getTwitchAccessToken();
            if (!token) {
                return message.reply("❌ Impossible de se connecter à l'API Twitch actuellement.");
            }

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

    // Commande manuelle !youtube
    if (message.content === PREFIX + 'youtube') {
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
            const videoId = latestVideo.id.videoId;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const videoTitle = latestVideo.snippet.title;
            const videoThumbnail = latestVideo.snippet.thumbnails.high.url;

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(`🔴 Nouvelle vidéo YouTube <@&1408165797288874004>  : ${videoTitle}`)
                .setURL(videoUrl)
                .setDescription(`Découvre notre tout dernier contenu fraîchement publié sur la chaîne !`)
                .setImage(videoThumbnail);

            return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error("Erreur lors de la commande !youtube :", error.message);
            return message.reply("⚠️ Une erreur est survenue lors de la récupération de la vidéo YouTube.");
        }
    }
    // #endregion

    // #region PARTIE ADMIN (Réservée aux modérateurs et administrateurs)

    // Commandes de Modération (!message et !react)
    if (message.content.startsWith(PREFIX + 'message') && admin) {
        const args = message.content.slice('!message'.length).trim().split(/ +/);
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

    else if (message.content.startsWith(PREFIX + 'react') && admin) {
        const args = message.content.slice('!react'.length).trim().split(/ +/);
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
            message.reply("❌ Impossible de configurer le système. Vérifie l'ID du message et s'il est bien dans le salon spécifié.");
        }
    }

    // Commandes d'Administration Pure (!muteAll, !unmuteAll, !clear)
    else if (message.content === PREFIX + 'muteAll') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");
        }

        try {
            const roleEveryone = message.guild.roles.everyone;
            await message.channel.permissionOverwrites.edit(roleEveryone, { SendMessages: false });
            await message.channel.send("🔒 **Le salon a été verrouillé.** Tout le monde a été rendu muet ici, sauf les administrateurs !");
            await message.delete().catch(() => { });
        } catch (error) {
            console.error("Erreur lors du !muteAll :", error);
            message.reply("❌ Je n'ai pas pu verrouiller le salon.");
        }
    }
    else if (message.content === PREFIX + 'unmuteAll') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");
        }

        try {
            const roleEveryone = message.guild.roles.everyone;
            await message.channel.permissionOverwrites.edit(roleEveryone, { SendMessages: null });
            await message.channel.send("🔓 **Le salon a été déverrouillé.** Tout le monde peut de nouveau écrire !");
            await message.delete().catch(() => { });
        } catch (error) {
            console.error("Erreur lors du !unmuteAll :", error);
            message.reply("❌ Je n'ai pas pu déverrouiller le salon.");
        }
    }
    else if (message.content.startsWith(PREFIX + 'clear')) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("❌ Seuls les administrateurs peuvent utiliser cette commande.");
        }

        const args = message.content.slice('!clear'.length).trim().split(/ +/);
        const nombreDeMessages = parseInt(args[0]);

        if (isNaN(nombreDeMessages) || nombreDeMessages < 1 || nombreDeMessages > 99) {
            return message.reply("❌ Tu dois spécifier un nombre entre 1 and 99. Exemple : `!clear 10`.");
        }

        const messageDemande = await message.reply(`⚠️ Tu es sur le point de supprimer les **${nombreDeMessages}** derniers messages. Tape \`!ok\` pour confirmer ou \`!cancel\` pour annuler.`);

        const filtre = response => response.author.id === message.author.id && ['!ok', '!cancel'].includes(response.content.toLowerCase());
        const collector = message.channel.createMessageCollector({ filter: filtre, time: 15000, max: 1 });

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

                    let texteConfirmation = `🗑️ **${quantiteReelle}** message(s) récent(s) ont été supprimés.`;
                    if (quantiteReelle < nombreDeMessages) {
                        texteConfirmation += ` *(Les autres messages demandés étaient trop vieux (+ de 14j) et ont été ignorés pour éviter un crash).*`;
                    }

                    const confirmation = await message.channel.send(texteConfirmation);
                    setTimeout(() => confirmation.delete().catch(() => { }), 5000);

                } catch (error) {
                    console.error("Erreur lors du filtrage et de la suppression :", error);
                    message.channel.send("❌ Une erreur est survenue lors de la tentative de suppression.");
                }
            } else {
                await messageDemande.edit("❌ Suppression annulée.");
                await reponseMessage.delete().catch(() => { });
                setTimeout(() => messageDemande.delete().catch(() => { }), 3000);
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await messageDemande.edit("⏱️ Temps écoulé, la suppression a été annulée.").catch(() => { });
                setTimeout(() => messageDemande.delete().catch(() => { }), 3000);
            }
        });
    }
    // #endregion
});
// #endregion

// #region Erreur et Start
process.on('unhandledRejection', error => {
    console.error('\n[ERREUR] Une erreur est survenue lors de la connexion :');
    console.error(error.message);
});

client.login(process.env.DISCORD_TOKEN);
// #endregion