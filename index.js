// ============================================================================
// #region 1. CONFIGURATION INITIALE & ENREGISTREMENT API REST
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

// Déclaration de TOUTES les commandes en Slash Commands avec descriptions et restrictions
const slashCommandsJSON = [
    // --- COMMANDES PUBLIQUES ---
    new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Salue le bot de manière interactive.'),
        
    new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Simule le lancer d\'un dé à 6 faces.'),
        
    new SlashCommandBuilder()
        .setName('uphelp')
        .setDescription('Affiche le centre d\'aide dynamique (Visible uniquement par vous).'),

    // --- COMMANDES DE MODÉRATION (Visibles uniquement par le Staff / Modérateurs) ---
    new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Donne un avertissement à un membre (Expulsion automatique au bout de 3).')
        .addUserOption(option => option.setName('membre').setDescription('Le membre à avertir').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('unwarn')
        .setDescription('Remet à zéro les avertissements d\'un membre.')
        .addUserOption(option => option.setName('membre').setDescription('Le membre à gracier').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Exclut temporairement un membre du serveur (10 minutes).')
        .addUserOption(option => option.setName('membre').setDescription('Le membre à réduire au silence').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Annule l\'exclusion temporaire d\'un membre.')
        .addUserOption(option => option.setName('membre').setDescription('Le membre à rétablir').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulse un membre du serveur.')
        .addUserOption(option => option.setName('membre').setDescription('Le membre à expulser').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannit définitivement un membre du serveur.')
        .addUserOption(option => option.setName('membre').setDescription('Le membre à bannir').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    new SlashCommandBuilder()
        .setName('muteall')
        .setDescription('Bloque ou débloque l\'envoi de messages dans le salon actuel pour tout le monde.')
        .addBooleanOption(option => option.setName('verrouiller').setDescription('True pour bloquer, False pour débloquer').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // --- COMMANDES STRICTEMENT ADMINISTRATEUR (Masquées aux non-admins) ---
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Supprime un nombre défini de messages dans le salon.')
        .addIntegerOption(option => option.setName('nombre').setDescription('Le nombre de messages à supprimer (1-99)').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Immunise un membre ou un rôle contre le système d\'AutoMod.')
        .addMentionableOption(option => option.setName('cible').setDescription('Le membre ou le rôle à immuniser').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('unwhitelist')
        .setDescription('Retire l\'immunité AutoMod d\'un membre ou d\'un rôle.')
        .addMentionableOption(option => option.setName('cible').setDescription('L\'élément à soumettre à nouveau').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName('react')
        .setDescription('Configure un message de Reaction-Role automatique.')
        .addRoleOption(option => option.setName('role').setDescription('Le rôle à attribuer').setRequired(true))
        .addStringOption(option => option.setName('emoji').setDescription('L\'emoji de réaction').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("🔄 Enregistrement de TOUTES les Slash Commands auprès de Discord...");
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID || "123456789012345678"),
            { body: slashCommandsJSON }
        );
        console.log("✅ Toutes les Slash Commands ont été enregistrées avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors du déploiement des commandes :", error);
    }
})();
// #endregion

// ============================================================================
// #region 2. PARAMÈTRES ET CONSTANTES DES SALONS
// ============================================================================
const ID_SALON_BIENVENUE = "1408157176316559420";
const ID_SALON_ANNONCES = "1407775485093478593"; 
const ID_SALON_LOGS_MODERATION = "1407801890380709939";
// #endregion

// ============================================================================
// #region 3. STRUCTURES DE DONNÉES EN MÉMOIRE VIVE (STATE)
// ============================================================================
const trackingSpamMembres = new Map();
const membresAvertisCount = new Map();
const listeBlancheAutoMod = new Set();
let estCanalVerrouilleGlobal = false;
let statutDernierLiveTwitch = false;
let identifiantDerniereVideoYT = null;
// #endregion

// ============================================================================
// #region 4. SERVEUR HTTP KEEP-ALIVE (POUR HÉBERGEMENT H24)
// ============================================================================
const portEcoute = process.env.PORT || 3000;
http.createServer((requete, reponse) => {
    reponse.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    reponse.end('🤖 UpFox Bot est opérationnel et en ligne !');
}).listen(portEcoute, () => {
    console.log(`🌐 Serveur fantôme Render activé sur le port ${portEcoute}`);
});
// #endregion

// ============================================================================
// #region 5. COUCHE SERVICES D'INTÉGRATION APIS EXTERNES
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
// #endregion

// ============================================================================
// #region 6. ÉVÉNEMENTS DE CYCLE DE VIE (READY)
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
// #endregion

// ============================================================================
// #region 7. ÉVÉNEMENTS DE FLUX DE MEMBRES
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
// #endregion

// ============================================================================
// #region 8. ÉVÉNEMENT CENTRAL DES MESSAGES TEXTUELS (🛡️ AUTOMOD PASSIF UNIQUEMENT)
// ============================================================================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const estModérateur = message.member.permissions.has(PermissionFlagsBits.ManageMessages);
    const estImmunise = listeBlancheAutoMod.has(message.author.id) || message.member.roles.cache.some(r => listeBlancheAutoMod.has(r.id));

    if (!estModérateur && !estImmunise) {
        // A. Traitement du Spam (Filtre temporel)
        const instantT = Date.now();
        if (!trackingSpamMembres.has(message.author.id)) {
            trackingSpamMembres.set(message.author.id, []);
        }
        const historiquesMessages = trackingSpamMembres.get(message.author.id);
        historiquesMessages.push(instantT);

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
});
// #endregion

// ============================================================================
// #region 9. GESTION GLOBALE DES EXCEPTIONS SYSTÈME (ANTI-CRASH)
// ============================================================================
process.on('unhandledRejection', (raison, promesse) => {
    console.error('💥 Erreur asynchrone non interceptée :', raison);
});
// #endregion

// ============================================================================
// #region 10. GESTIONNAIRE CENTRAL DES INTERACTIONS (TOUTES LES SLASH COMMANDS)
// ============================================================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member, guild } = interaction;

    // --- COMMANDES PUBLIQUES ---

    if (commandName === 'hello') {
        await interaction.reply(`🦊 Bonjour ${interaction.user} ! Comment se porte le clan aujourd'hui ?`);
    }

    if (commandName === 'roll') {
        const resultatDe = Math.floor(Math.random() * 6) + 1;
        await interaction.reply(`🎲 **${interaction.user.username}** lance un dé à 6 faces et obtient un **${resultatDe}** !`);
    }

    if (commandName === 'uphelp') {
        const estModérateur = guild && member ? member.permissions.has(PermissionFlagsBits.ManageMessages) : false;
        const estAdministrateur = guild && member ? member.permissions.has(PermissionFlagsBits.Administrator) : false;

        const embedHelp = new EmbedBuilder()
            .setTitle("🦊 Centre d'Aide UpFox")
            .setDescription("Liste des commandes disponibles adaptées à votre profil.")
            .setColor('#2ECC71')
            .addFields({ name: "👤 Commandes Publiques", value: "`/hello` - Saluer le bot\n`/roll` - Lancer un dé\n`/uphelp` - Ce menu" });

        if (estModérateur || estAdministrateur) {
            embedHelp.addFields({ 
                name: "⚔️ Modération Staff", 
                value: "`/warn` - Donner un avertissement\n`/unwarn` - Reset les infractions\n`/mute` - Rendre muet 10min\n`/unmute` - Annuler le mute\n`/kick` - Expulser\n`/ban` - Bannir\n`/muteall` - Verrouiller un salon" 
            });
        }

        if (estAdministrateur) {
            embedHelp.addFields({ 
                name: "⚙️ Administration Pro", 
                value: "`/clear` - Nettoyer le salon\n`/whitelist` - Immuniser un rôle/membre\n`/unwhitelist` - Retirer l'immunité\n`/react` - Créer un Reaction-Role" 
            });
        }

        await interaction.reply({ embeds: [embedHelp], ephemeral: true });
    }

    // --- COMMANDES DE MODÉRATION ---

    if (commandName === 'warn') {
        const cible = options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        let infractions = (membresAvertisCount.get(cible.id) || 0) + 1;
        membresAvertisCount.set(cible.id, infractions);

        if (infractions >= 3) {
            await cible.kick("Cumul de 3 avertissements (Automatique)").catch(() => {});
            membresAvertisCount.set(cible.id, 0);
            await interaction.reply(`🚨 **${cible.user.tag}** a été expulsé après son 3ème avertissement.`);
        } else {
            await interaction.reply(`⚠️ **${cible.user.tag}** a reçu un avertissement (${infractions}/3).`);
        }
    }

    if (commandName === 'unwarn') {
        const cible = options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        membresAvertisCount.set(cible.id, 0);
        await interaction.reply(`✅ Les avertissements de **${cible.user.tag}** ont été remis à zéro.`);
    }

    if (commandName === 'mute') {
        const cible = options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        await cible.timeout(10 * 60 * 1000, "Sanction via /mute").catch(() => {});
        await interaction.reply(`🔇 **${cible.user.tag}** a été exclu temporairement pour 10 minutes.`);
    }

    if (commandName === 'unmute') {
        const cible = options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        await cible.timeout(null).catch(() => {});
        await interaction.reply(`🔊 Exclusion annulée pour **${cible.user.tag}**.`);
    }

    if (commandName === 'kick') {
        const cible = options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        await cible.kick("Expulsé via /kick").catch(() => {});
        await interaction.reply(`🥾 **${cible.user.tag}** a été expulsé.`);
    }

    if (commandName === 'ban') {
        const cible = options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        await cible.ban({ reason: "Banni via /ban" }).catch(() => {});
        await interaction.reply(`🔨 **${cible.user.tag}** a été banni définitivement.`);
    }

    if (commandName === 'muteall') {
        const verrouiller = options.getBoolean('verrouiller');
        estCanalVerrouilleGlobal = verrouiller;

        await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, {
            SendMessages: !verrouiller
        });
        await interaction.reply(verrouiller ? "🔒 Salon verrouillé." : "🔓 Salon déverrouillé.");
    }

    // --- COMMANDES ADMINISTRATEUR ---

    if (commandName === 'clear') {
        const nombreDeMessages = options.getInteger('nombre');

        if (nombreDeMessages < 1 || nombreDeMessages > 99) {
            return await interaction.reply({ content: "❌ Indiquez un nombre entre 1 et 99.", ephemeral: true });
        }

        await interaction.reply({ 
            content: `⚠️ Confirmez la suppression de **${nombreDeMessages}** messages en tapant \`!ok\` ou \`!cancel\`.`, 
            ephemeral: false 
        });

        const filtreConfirmation = response => response.author.id === interaction.user.id && ['!ok', '!cancel'].includes(response.content.toLowerCase());
        const collector = interaction.channel.createMessageCollector({ filter: filtreConfirmation, time: 15000, max: 1 });

        collector.on('collect', async (reponseMessage) => {
            if (reponseMessage.content.toLowerCase() === '!ok') {
                try {
                    const messagesDuSalon = await interaction.channel.messages.fetch({ limit: nombreDeMessages + 1 });
                    const limite14Jours = Date.now() - (14 * 24 * 60 * 60 * 1000);
                    const messagesSupprimables = messagesDuSalon.filter(msg => msg.createdTimestamp > limite14Jours);
                    
                    if (messagesSupprimables.size > 0) {
                        await interaction.channel.bulkDelete(messagesSupprimables);
                    }

                    await interaction.editReply({ content: `🗑️ Nettoyage effectué avec succès !` });
                    await reponseMessage.delete().catch(() => {});
                    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
                } catch (error) {
                    console.error(error);
                    await interaction.followUp({ content: "❌ Erreur lors du bulkDelete.", ephemeral: true });
                }
            } else {
                await interaction.editReply({ content: "❌ Suppression annulée." });
                await reponseMessage.delete().catch(() => {});
                setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({ content: "⏱️ Temps écoulé. Suppression annulée." }).catch(() => {});
                setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
            }
        });
    }

    if (commandName === 'whitelist') {
        const cible = options.getMentionable('cible');
        listeBlancheAutoMod.add(cible.id);
        await interaction.reply(`✅ **${cible.user?.tag || cible.name}** est désormais immunisé contre l'AutoMod.`);
    }

    if (commandName === 'unwhitelist') {
        const cible = options.getMentionable('cible');
        listeBlancheAutoMod.delete(cible.id);
        await interaction.reply(`🚫 **${cible.user?.tag || cible.name}** est de nouveau soumis à l'AutoMod.`);
    }

    if (commandName === 'react') {
        const role = options.getRole('role');
        const emoji = options.getString('emoji');

        const embedReactionRole = new EmbedBuilder()
            .setTitle("🎭 Attribution Automatique de Rôle")
            .setDescription(`Réagissez avec l'emoji ${emoji} pour obtenir ou retirer le rôle **${role.name}** !`)
            .setColor('#3498DB');

        const messageEnvoye = await interaction.reply({ embeds: [embedReactionRole], fetchReply: true });
        await messageEnvoye.react(emoji);

        const filtreReactions = (reaction, user) => reaction.emoji.name === emoji && !user.bot;
        const collecteurReactions = messageEnvoye.createReactionCollector({ filter: filtreReactions, dispose: true });

        collecteurReactions.on('collect', async (reaction, utilisateur) => {
            const membreGuilde = await guild.members.fetch(utilisateur.id);
            await membreGuilde.roles.add(role.id).catch(() => {});
        });

        collecteurReactions.on('remove', async (reaction, utilisateur) => {
            const membreGuilde = await guild.members.fetch(utilisateur.id);
            await membreGuilde.roles.remove(role.id).catch(() => {});
        });
    }
});
// #endregion

client.login(process.env.DISCORD_TOKEN);