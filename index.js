// index.js
const { Client, GatewayIntentBits, EmbedBuilder, PermissionFlagsBits, ActivityType, Collection } = require('discord.js');
const axios = require('axios');
const http = require('http');
const fs = require('fs');
const path = require('path');
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

// #region 3. STRUCTURES DE DONNÉES EN MÉMOIRE VIVE (STATE GLOBAL)
const trackingSpamMembres = new Map();
const membresAvertisCount = new Map();
const listeBlancheAutoMod = new Set();
let estCanalVerrouilleGlobal = false;
let statutDernierLiveTwitch = false;
let identifiantDerniereVideoYT = null;

// Exportation du state pour que les sous-fichiers y accèdent si besoin via le client
client.state = { membresAvertisCount, listeBlancheAutoMod, trackingSpamMembres };
// #endregion

// #region CHARGEMENT DYNAMIQUE DES COMMANDES
client.commands = new Collection();

const categories = ['public', 'moderation', 'admin'];
for (const categorie of categories) {
    const cheminDossier = path.join(__dirname, 'commands', categorie);
    if (!fs.existsSync(cheminDossier)) continue;
    
    const fichiersCommandes = fs.readdirSync(cheminDossier).filter(file => file.endsWith('.js'));
    for (const fichier of fichiersCommandes) {
        const commande = require(path.join(cheminDossier, fichier));
        client.commands.set(commande.name, commande);
    }
}
console.log(`📦 Configuration : ${client.commands.size} commandes prêtes à l'action.`);
// #endregion

// ============================================================================
// #region 2. PARAMÈTRES ET CONSTANTES DES SALONS
// ============================================================================
const ID_SALON_BIENVENUE = "1408157176316559420";
const ID_SALON_ANNONCES = "1407775485093478593"; 
const ID_SALON_LOGS_MODERATION = "1407801890380709939";
// #endregion

// ============================================================================
// #region 4. SERVEUR HTTP KEEP-ALIVE
// ============================================================================
const portEcoute = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('🤖 UpFox Bot de subdivision opérationnel !');
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
    console.log(`🤖 Bot connecté de manière modulaire en tant que ${client.user.tag}!`);
    client.user.setActivity({ name: "protéger le clan Fox", type: ActivityType.Custom });

    setInterval(verifierFluxDirectTwitch, 300000);
    setInterval(verifierNouvelleVideoYouTube, 300000);
});
// #endregion

// ============================================================================
// #region 7. ÉVÉNEMENTS DE FLUX DE MEMBRES
// ============================================================================
client.on('guildMemberAdd', async (membre) => {
    const salonBienvenue = await client.channels.fetch(ID_SALON_BIENVENUE).catch(() => null);
    if (salonBienvenue) await salonBienvenue.send(`🦊 Bienvenue au sein du clan, ${membre} !`);
});

client.on('guildMemberRemove', async (membre) => {
    const salonBienvenue = await client.channels.fetch(ID_SALON_BIENVENUE).catch(() => null);
    if (salonBienvenue) await salonBienvenue.send(`🍂 **${membre.user.tag}** a quitté le terrier.`);
});
// #endregion

// ============================================================================
// #region 8. ÉVÉNEMENT CENTRAL DES MESSAGES TEXTUELS (🛡️ AUTOMOD PASSIF)
// ============================================================================
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const estModérateur = message.member.permissions.has(PermissionFlagsBits.ManageMessages);
    const estImmunise = client.state.listeBlancheAutoMod.has(message.author.id) || message.member.roles.cache.some(r => client.state.listeBlancheAutoMod.has(r.id));

    if (!estModérateur && !estImmunise) {
        // [Garder la même logique d'AutoMod passif ici pour le Spam, Insultes et CapsLock]
        // Utilise client.state.trackingSpamMembres au lieu de trackingSpamMembres direct
    }
});
// #endregion

// ============================================================================
// #region 9. GESTION GLOBALE DES EXCEPTIONS SYSTEME
// ============================================================================
process.on('unhandledRejection', (raison) => {
    console.error('💥 Erreur asynchrone non interceptée :', raison);
});
// #endregion

// ============================================================================
// #region 10. GESTIONNAIRE D'INTERACTIONS (ROUTEUR DYNAMIQUE DE COMMANDES)
// ============================================================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Récupération de la commande chargée dynamiquement
    const commande = client.commands.get(interaction.commandName);
    if (!commande) return;

    try {
        // Exécution déportée
        await commande.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true }).catch(() => {});
    }
});
// #endregion

client.login(process.env.DISCORD_TOKEN);