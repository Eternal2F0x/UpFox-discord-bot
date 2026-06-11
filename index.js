// index.js
const { Client, GatewayIntentBits, Collection } = require('discord.js');
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

// Initialisations des collections
client.commands = new Collection();

// 1. Chargement des Commandes
const categories = ['public', 'moderation', 'admin'];
for (const cat of categories) {
    const chemin = path.join(__dirname, 'commands', cat);
    if (!fs.existsSync(chemin)) continue;
    fs.readdirSync(chemin).filter(f => f.endsWith('.js')).forEach(file => {
        const cmd = require(path.join(chemin, file));
        client.commands.set(cmd.name, cmd);
    });
}

// 2. Chargement des Événements (Events)
const cheminEvents = path.join(__dirname, 'events');
fs.readdirSync(cheminEvents).filter(f => f.endsWith('.js')).forEach(file => {
    const event = require(path.join(cheminEvents, file));
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
});

// 3. Routage centralisé des Interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;
    try { await cmd.execute(interaction); } catch (e) { console.error(e); }
});

// 4. Lancement des boucles de Services Externes (Twitch / YT) au démarrage
client.once('ready', () => {
    console.log(`🦊 UpFox connecté de manière modulaire avancée [${client.user.tag}]`);
    
    // Chargement des scripts de surveillance d'APIs
    const twitchService = require('./utils/twitch');
    const youtubeService = require('./utils/youtube');
    
    // Démarrage des boucles de surveillance (Toutes les 5 minutes)
    setInterval(() => twitchService.execute(client), 300000);
    setInterval(() => youtubeService.execute(client), 300000);
});

// 5. Serveur Web d'Hébergement minimal
http.createServer((req, res) => { res.end('🤖 UpFox Actif'); }).listen(process.env.PORT || 3000);

client.login(process.env.DISCORD_TOKEN);