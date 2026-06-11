// ============================================================================
// 1. CONFIGURATION INITIALE & ENREGISTREMENT API REST
// ============================================================================
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    ActivityType
} = require('discord.js');
const axios = require('axios');
const http = require('http');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Enregistrement des Slash Commands auprès de l'API de Discord Gateway
const slashCommandsJSON = [
    new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Salue le bot de manière interactive.'),
        
    new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Simule le lancer d\'un dé à 6 faces.'),
        
    new SlashCommandBuilder()
        .setName('uphelp')
        .setDescription('Affiche le centre d\'aide dynamique (Visible uniquement par vous).'),
        
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Supprime un nombre défini de messages (Admin uniquement).')
        .addIntegerOption(option => 
            option.setName('nombre')
                .setDescription('Le nombre de messages à supprimer (1-99)')
                .setRequired(true))
        // SÉCURITÉ NATIVE DISCORD : Cache la commande aux membres n'ayant pas la permission ADMINISTRATEUR
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("🔄 Enregistrement des Slash Commands auprès de Discord...");
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || "123456789012345678"), // Remplir ou laisser l'API globale gérer
            { body: slashCommandsJSON }
        );
        console.log("✅ Slash Commands enregistrées avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors de l'enregistrement des Slash Commands :", error);
    }
})();

// ============================================================================
// 2. PARAMÈTRES ET CONSTANTES DES SALONS
// ============================================================================
const ID_SALON_BIENVENUE = "1408157176316559420";
const ID_SALON_ANNONCES = "1407775485093478593"; 
const ID_SALON_LOGS_MODERATION = "1407801890380709939";

// ============================================================================
// 3. STRUCTURES DE DONNÉES EN MÉMOIRE VIVE (STATE)
// ============================================================================
const trackingSpamMembres = new Map();
const membresAvertisCount = new Map();
const listeBlancheAutoMod = new Set();
let estCanalVerrouilleGlobal = false;
let statutDernierLiveTwitch = false;
let identifiantDerniereVideoYT = null;

// ============================================================================
// 4. SERVEUR HTTP KEEP-ALIVE (POUR HÉBERGEMENT H24)
// ============================================================================
const portEcoute = process.env.PORT || 3000;
http.createServer((requete, reponse) => {
    reponse.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    reponse.end('🤖 UpFox Bot est opérationnel et en ligne !');
}).listen(portEcoute, () => {
    console.log(`🌐 Serveur fantôme Render activé sur le port ${portEcoute}`);
});

// ============================================================================
// 5. COUCHE SERVICES D'INTÉGRATION APIS EXTERNES
// ============================================================================
async function recupererJetonAuthentificationTwitch() {
    try {
        const reponseToken = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });
        return reponseToken.data.access_token;
    } catch (err) {
        console.error("❌ Échec de génération du Token Twitch OAuth2 :", err.message);
        return null;
    }
}

async function verifierFluxDirectTwitch() {
    const jetonTwitch = await recupererJetonAuthentificationTwitch();
    if (!jetonTwitch) return;

    try {
        const reponseFlux = await axios.get('https://api.twitch.tv/helix/streams', {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${jetonTwitch}`
            },
            params: { user_login: process.env.TWITCH_CHANNEL_NAME }
        });

        const donneesFlux = reponseFlux.data.data;
        const salonAnnonces = await client.channels.fetch(ID_SALON_ANNONCES).catch(() => null);

        if (donneesFlux.length > 0) {
            if (!statutDernierLiveTwitch) {
                statutDernierLiveTwitch = true;
                const infoLive = donneesFlux[0];
                
                if (salonAnnonces) {
                    const embedTwitch = new EmbedBuilder()
                        .setTitle(`🦊 ${infoLive.user_name} est en LIVE sur Twitch !`)
                        .setDescription(`**Jeu :** ${infoLive.game_name}\n**Titre :** ${infoLive.title}`)
                        .setURL(`https://twitch.tv/${process.env.TWITCH_CHANNEL_NAME}`)
                        .setColor('#9146FF')
                        .setImage(infoLive.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
                        .setTimestamp();

                    await salonAnnonces.send({ content: `📢 @everyone **${infoLive.user_name}** vient de lancer un stream !`, embeds: [embedTwitch] });
                }
            }
        } else {
            statutDernierLiveTwitch = false;
        }
    } catch (error) {
        console.error("❌ Erreur lors du scan API Twitch Helix :", error.message);
    }
}

async function verifierNouvelleVideoYouTube() {
    try {
        const reponseYT = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key: process.env.YOUTUBE_API_KEY,
                channelId: process.env.YOUTUBE_CHANNEL_ID,
                part: 'snippet,id',
                order: 'date',
                maxResults: 1
            }
        });

        const elements = reponseYT.data.items;
        if (!elements || elements.length === 0) return;

        const derniereVideo = elements[0];
        if (derniereVideo.id.kind !== 'youtube#video') return;

        const idVideoActuelle = derniereVideo.id.videoId;
        const salonAnnonces = await client.channels.fetch(ID_SALON_ANNONCES).catch(() => null);

        if (!identifiantDerniereVideoYT) {
            identifiantDerniereVideoYT = idVideoActuelle;
            return;
        }

        if (idVideoActuelle !== identifiantDerniereVideoYT) {
            identifiantDerniereVideoYT = idVideoActuelle;

            if (salonAnnonces) {
                const embedYouTube = new EmbedBuilder()
                    .setTitle(`🎥 Nouvelle vidéo de ${derniereVideo.snippet.channelTitle} !`)
                    .setDescription(derniereVideo.snippet.title)
                    .setURL(`https://www.youtube.com/watch?v=${idVideoActuelle}`)
                    .setColor('#FF0000')
                    .setImage(derniereVideo.snippet.thumbnails.high.url)
                    .setTimestamp();

                await salonAnnonces.send({ content: `🔔 Nouvelle vidéo disponible !`, embeds: [embedYouTube] });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors du traitement API YouTube Data v3 :", error.message);
    }
}

// ============================================================================
// 6. ÉVÉNEMENTS DE CYCLE DE VIE (READY)
// ============================================================================
client.once('ready', () => {
    console.log(`🤖 Bot connecté avec succès en tant que ${client.user.tag}!`);
    
    client.user.setActivity({
        name: "protéger le clan Fox",
        type: ActivityType.Custom
    });

    console.log("⏱️ [Automate] Boucle de vérification Twitch & YouTube initialisée (Intervalle : 5min).");
    setInterval(verifierFluxDirectTwitch, 300000);
    setInterval(verifierNouvelleVideoYouTube, 300000);
});

// ============================================================================
// 7. ÉVÉNEMENTS DE FLUX DE MEMBRES
// ============================================================================
client.on('guildMemberAdd', async (membre) => {
    const salonBienvenue = await client.channels.fetch(ID_SALON_BIENVENUE).catch(() => null);
    if (salonBienvenue) {
        await salonBienvenue.send(`🦊 Bienvenue au sein du clan, ${membre} ! Amuse-toi bien parmi nous.`);
    }
});

client.on('guildMemberRemove', async (membre) => {
    const salonBienvenue = await client.channels.fetch(ID_SALON_BIENVENUE).catch(() => null);
    if (salonBienvenue) {
        await salonBienvenue.send(`🍂 **${membre.user.tag}** a quitté le terrier. Bonne continuation à lui.`);
    }
});

// ============================================================================
// 8. ÉVÉNEMENT CENTRAL DES MESSAGES TEXTUELS (PREFIXE `!`)
// ============================================================================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const estModérateur = message.member.permissions.has(PermissionFlagsBits.ManageMessages);
    const estImmunise = listeBlancheAutoMod.has(message.author.id) || message.member.roles.cache.some(r => listeBlancheAutoMod.has(r.id));

    // 🛡️ SYSTÈME AUTOMOD PASSIF
    if (!estModérateur && !estImmunise) {
        // A. Traitement du Spam (Filtre temporel)
        const instantT = Date.now();
        if (!trackingSpamMembres.has(message.author.id)) {
            trackingSpamMembres.set(message.author.id, []);
        }
        const historiquesMessages = trackingSpamMembres.get(message.author.id);
        historiquesMessages.push(instantT);

        // Analyse sur les 4 dernières secondes
        const fenetreFiltre = historiquesMessages.filter(timestamp => instantT - timestamp < 4000);
        trackingSpamMembres.set(message.author.id, fenetreFiltre);

        if (fenetreFiltre.length > 4) {
            await message.delete().catch(() => {});
            const avertissementSpam = await message.channel.send(`⚠️ ${message.author}, merci de ralentir la cadence (Anti-Spam).`);
            setTimeout(() => avertissementSpam.delete().catch(() => {}), 4000);
            return;
        }

        // B. Traitement des insultes et Grossièretés
        const listeMotsProscrits = ['merde', 'connard', 'salope', 'fdp', 'pute']; 
        const messageNormalise = message.content.toLowerCase();
        if (listeMotsProscrits.some(mot => messageNormalise.includes(mot))) {
            await message.delete().catch(() => {});
            
            const logsSalon = await client.channels.fetch(ID_SALON_LOGS_MODERATION).catch(() => null);
            if (logsSalon) {
                const embedLogInsulte = new EmbedBuilder()
                    .setTitle("🛡️ Auto-Mod : Propos Inappropriés Bloqués")
                    .setColor('#FF9900')
                    .addFields(
                        { name: "Auteur", value: `${message.author} (${message.author.id})`, inline: true },
                        { name: "Salon", value: `${message.channel}`, inline: true },
                        { name: "Message d'origine", value: message.content }
                    )
                    .setTimestamp();
                await logsSalon.send({ embeds: [embedLogInsulte] });
            }

            const alerteInsulte = await message.channel.send(`❌ ${message.author}, les propos vulgaires sont interdits ici.`);
            setTimeout(() => alerteInsulte.delete().catch(() => {}), 5000);
            return;
        }

        // C. Traitement de l'abus de MAJUSCULES (CAPSLOCK)
        if (message.content.length > 8) {
            const lettresUniquement = message.content.replace(/[^a-zA-Z]/g, '');
            if (lettresUniquement.length > 0) {
                const lettresMajuscules = lettresUniquement.replace(/[^A-Z]/g, '');
                const ratioMajuscules = lettresMajuscules.length / lettresUniquement.length;

                if (ratioMajuscules > 0.70) {
                    await message.delete().catch(() => {});
                    const alerteCaps = await message.channel.send(`⚠️ ${message.author}, évite de crier en majuscules !`);
                    setTimeout(() => alerteCaps.delete().catch(() => {}), 4000);
                    return;
                }
            }
        }
    }

    // ⚔️ BLOC DES COMMANDES ADMINISTRATIVES AVEC PRÉFIXE `!`
    if (!message.content.startsWith('!')) return;

    const argumentsCommande = message.content.slice(1).trim().split(/ +/);
    const nomCommande = argumentsCommande.shift().toLowerCase();

    // Commande MUTEALL / UNMUTEALL
    if (nomCommande === 'muteall' || nomCommande === 'unmuteall') {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return;
        const statutVerrou = (nomCommande === 'muteall');
        estCanalVerrouilleGlobal = statutVerrou;

        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: !statutVerrou
        });
        await message.reply(statutVerrou ? "🔒 Le salon a été verrouillé (MuteAll activé)." : "🔓 Le salon a été déverrouillé (MuteAll désactivé).");
        return;
    }

    // Commande WARN / UNWARN
    if (nomCommande === 'warn') {
        if (!estModérateur) return;
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Mentionnez le membre à avertir.");

        let infractions = (membresAvertisCount.get(cible.id) || 0) + 1;
        membresAvertisCount.set(cible.id, infractions);

        if (infractions >= 3) {
            await cible.kick("Cumul de 3 avertissements (Automatique)").catch(() => {});
            membresAvertisCount.set(cible.id, 0);
            await message.channel.send(`🚨 **${cible.user.tag}** a été expulsé du serveur après avoir reçu son 3ème avertissement.`);
        } else {
            await message.channel.send(`⚠️ **${cible.user.tag}** a reçu un avertissement (${infractions}/3).`);
        }
        return;
    }

    if (nomCommande === 'unwarn') {
        if (!estModérateur) return;
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Mentionnez le membre à gracier.");

        membresAvertisCount.set(cible.id, 0);
        await message.reply(`✅ Les avertissements de **${cible.user.tag}** ont été remis à zéro.`);
        return;
    }

    // Commande MUTE / UNMUTE (Via timeout natif Discord)
    if (nomCommande === 'mute') {
        if (!estModérateur) return;
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Mentionnez le membre à isoler.");
        
        // Par défaut exclusion de 10 minutes
        await cible.timeout(10 * 60 * 1000, "Sanction par commande !mute").catch(() => {});
        await message.reply(`🔇 **${cible.user.tag}** a été réduit au silence pour 10 minutes.`);
        return;
    }

    if (nomCommande === 'unmute') {
        if (!estModérateur) return;
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Mentionnez le membre à rétablir.");

        await cible.timeout(null).catch(() => {});
        await message.reply(`🔊 **${cible.user.tag}** peut de nouveau s'exprimer.`);
        return;
    }

    // Commande KICK / BAN
    if (nomCommande === 'kick') {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return;
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Mentionnez le membre à expulser.");

        await cible.kick("Expulsé par commande staff").catch(() => {});
        await message.reply(`🥾 **${cible.user.tag}** a été expulsé.`);
        return;
    }

    if (nomCommande === 'ban') {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return;
        const cible = message.mentions.members.first();
        if (!cible) return message.reply("❌ Mentionnez le membre à bannir.");

        await cible.ban({ reason: "Banni par commande staff" }).catch(() => {});
        await message.reply(`🔨 **${cible.user.tag}** a été banni définitivement.`);
        return;
    }

    // Commande WHITELIST / UNWHITELIST (Immunisation AutoMod)
    if (nomCommande === 'whitelist') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const cibleMentionnee = message.mentions.members.first() || message.mentions.roles.first();
        if (!cibleMentionnee) return message.reply("❌ Mentionnez un membre ou un rôle à immuniser.");

        listeBlancheAutoMod.add(cibleMentionnee.id);
        await message.reply(`✅ **${cibleMentionnee.user?.tag || cibleMentionnee.name}** est désormais immunisé contre l'AutoMod.`);
        return;
    }

    if (nomCommande === 'unwhitelist') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        const cibleMentionnee = message.mentions.members.first() || message.mentions.roles.first();
        if (!cibleMentionnee) return message.reply("❌ Mentionnez un élément à retirer de l'immunité.");

        listeBlancheAutoMod.delete(cibleMentionnee.id);
        await message.reply(`🚫 **${cibleMentionnee.user?.tag || cibleMentionnee.name}** est de nouveau soumis à l'AutoMod.`);
        return;
    }

    // Configuration Interactive du Reaction Role (!react)
    if (nomCommande === 'react') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        
        const identifiantRole = argumentsCommande[0];
        const emojiReaction = argumentsCommande[1];

        if (!identifiantRole || !emojiReaction) {
            return message.reply("❌ Syntaxe incorrecte. Exemple : `!react ID_DU_ROLE 👍`");
        }

        const embedReactionRole = new EmbedBuilder()
            .setTitle("🎭 Attribution Automatique de Rôle")
            .setDescription(`Réagissez avec l'emoji ${emojiReaction} pour obtenir ou retirer le rôle associé !`)
            .setColor('#3498DB');

        const messageEnvoye = await message.channel.send({ embeds: [embedReactionRole] });
        await messageEnvoye.react(emojiReaction);

        // Collecteur persistant passif (Gestion via les événements globaux recommandée en production, mais valide ici)
        const filtreReactions = (reaction, user) => reaction.emoji.name === emojiReaction && !user.bot;
        const collecteurReactions = messageEnvoye.createReactionCollector({ filter: filtreReactions, dispose: true });

        collecteurReactions.on('collect', async (reaction, utilisateur) => {
            const membreGuilde = await message.guild.members.fetch(utilisateur.id);
            await membreGuilde.roles.add(identifiantRole).catch(() => {});
        });

        collecteurReactions.on('remove', async (reaction, utilisateur) => {
            const membreGuilde = await message.guild.members.fetch(utilisateur.id);
            await membreGuilde.roles.remove(identifiantRole).catch(() => {});
        });
    }
});

// ============================================================================
// 9. GESTION GLOBALE DES EXCEPTIONS SYSTÈME (ANTI-CRASH)
// ============================================================================
process.on('unhandledRejection', (raison, promesse) => {
    console.error('💥 Erreur asynchrone non interceptée :', raison);
});

// ============================================================================
// 10. GESTIONNAIRE D'INTERACTIONS D'INTERFACE UTILISATEUR (SLASH COMMANDS)
// ============================================================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member, guild } = interaction;

    // ==========================================
    // 💻 COMMANDE : /HELLO
    // ==========================================
    if (commandName === 'hello') {
        await interaction.reply(`🦊 Bonjour ${interaction.user} ! Comment se porte le clan aujourd'hui ?`);
    }

    // ==========================================
    // 🎲 COMMANDE : /ROLL
    // ==========================================
    if (commandName === 'roll') {
        const resultatDe = Math.floor(Math.random() * 6) + 1;
        await interaction.reply(`🎲 **${interaction.user.username}** lance un dé à 6 faces et obtient un **${resultatDe}** !`);
    }

    // ==========================================
    // 📑 COMMANDE : /UPHELP (SÉCURISÉE)
    // ==========================================
    if (commandName === 'uphelp') {
        // Validation anti-crash : Vérifie si la commande s'exécute bien sur un serveur
        const estModérateur = guild && member ? member.permissions.has(PermissionFlagsBits.ManageMessages) : false;
        const estAdministrateur = guild && member ? member.permissions.has(PermissionFlagsBits.Administrator) : false;

        const embedHelp = new EmbedBuilder()
            .setTitle("🦊 Centre d'Aide UpFox")
            .setDescription("Liste des commandes disponibles adaptées à votre profil.")
            .setColor('#2ECC71')
            .addFields(
                { name: "👤 Commandes Publiques", value: "`/hello` - Saluer le bot\n`/roll` - Lancer un dé à 6 faces\n`/uphelp` - Afficher ce menu d'aide" }
            );

        if (estModérateur || estAdministrateur) {
            embedHelp.addFields({ 
                name: "⚔️ Modération Staff (`!`)", 
                value: "`!warn @membre` - Donner un avertissement (Kick à 3)\n`!unwarn @membre` - Reset les infractions\n`!mute @membre` - Rendre muet 10min\n`!unmute @membre` - Annuler le mute\n`!kick @membre` - Expulser\n`!ban @membre` - Bannir\n`!muteall` - Verrouiller le salon textuel" 
            });
        }

        if (estAdministrateur) {
            embedHelp.addFields({ 
                name: "⚙️ Administration Pro", 
                value: "`/clear [nombre]` - Nettoyage de salon en masse\n`!whitelist @cible` - Ajouter à la liste blanche\n`!unwhitelist @cible` - Retirer de la liste blanche\n`!react [RoleID] [Emoji]` - Créer un Reaction-Role" 
            });
        }

        // Réponse éphémère (uniquement visible par l'appelant)
        await interaction.reply({ embeds: [embedHelp], ephemeral: true });
    }

    // ==========================================
    // 🗑️ COMMANDE CORRIGÉE : /CLEAR
    // ==========================================
    if (commandName === 'clear') {
        // Double sécurité au cas où (même si Discord cache déjà le raccourci aux non-admins)
        if (!guild || !member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({ content: "❌ Seuls les administrateurs peuvent utiliser cette commande.", ephemeral: true });
        }

        const nombreDeMessages = options.getInteger('nombre');

        if (nombreDeMessages < 1 || nombreDeMessages > 99) {
            return await interaction.reply({ content: "❌ Indiquez un nombre entre 1 et 99.", ephemeral: true });
        }

        // Étape 1 : Demande de confirmation
        await interaction.reply({ 
            content: `⚠️ Confirmez la suppression de **${nombreDeMessages}** messages en tapant \`!ok\` ou \`!cancel\` dans le salon.`, 
            ephemeral: false 
        });

        // Collecteur de confirmation textuelle
        const filtreConfirmation = response => response.author.id === interaction.user.id && ['!ok', '!cancel'].includes(response.content.toLowerCase());
        const collector = interaction.channel.createMessageCollector({ filter: filtreConfirmation, time: 15000, max: 1 });

        collector.on('collect', async (reponseMessage) => {
            if (reponseMessage.content.toLowerCase() === '!ok') {
                try {
                    // +1 pour inclure le message de confirmation "!ok"
                    const messagesDuSalon = await interaction.channel.messages.fetch({ limit: nombreDeMessages + 1 });
                    const limite14Jours = Date.now() - (14 * 24 * 60 * 60 * 1000);
                    const messagesSupprimables = messagesDuSalon.filter(msg => msg.createdTimestamp > limite14Jours);
                    
                    if (messagesSupprimables.size > 0) {
                        await interaction.channel.bulkDelete(messagesSupprimables);
                    }

                    await interaction.editReply({ content: `🗑️ Nettoyage de **${messagesSupprimables.size - 1}** messages effectué avec succès !` });
                    await reponseMessage.delete().catch(() => {});
                    
                    // Nettoie l'alerte du bot après 5 secondes
                    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
                } catch (error) {
                    console.error(error);
                    await interaction.followUp({ content: "❌ Erreur interne lors de l'exécution du bulkDelete.", ephemeral: true });
                }
            } else {
                await interaction.editReply({ content: "❌ Suppression annulée." });
                await reponseMessage.delete().catch(() => {});
                setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({ content: "⏱️ Temps écoulé. Suppression automatique annulée." }).catch(() => {});
                setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
            }
        });
    }
});

// Connexion finale du client à l'infrastructure Discord
client.login(process.env.DISCORD_TOKEN);