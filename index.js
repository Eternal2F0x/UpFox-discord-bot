// index.js
console.log("🚀 [DEBUG] Étape 1 : Le script démarre...");

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log("📦 [DEBUG] Étape 2 : Modules chargés. Token trouvé :", process.env.DISCORD_TOKEN ? "OUI ✅" : "NON ❌");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

client.commands = new Collection();

// --- INITIALISATION DU STATE (Crucial pour tes commandes !) ---
client.state = {
    listeBlancheAutoMod: new Set(),
    membresAvertisCount: new Map()
};

// 1. Chargement des Commandes
console.log("📂 [DEBUG] Étape 3 : Chargement des commandes...");
const categories = ['public', 'moderation', 'admin'];
for (const cat of categories) {
    const chemin = path.join(__dirname, 'commands', cat);
    if (!fs.existsSync(chemin)) {
        console.log(`⚠️ Dossier manquant : ${chemin}`);
        continue;
    }
    fs.readdirSync(chemin).filter(f => f.endsWith('.js')).forEach(file => {
        const cmd = require(path.join(chemin, file));
        client.commands.set(cmd.name, cmd);
        console.log(`🔍 Commande chargée : /${cmd.name}`);
    });
}

// 2. Chargement des Événements
console.log("⚡ [DEBUG] Étape 4 : Chargement des événements...");
const cheminEvents = path.join(__dirname, 'events');
if (fs.existsSync(cheminEvents)) {
    fs.readdirSync(cheminEvents).filter(f => f.endsWith('.js')).forEach(file => {
        const event = require(path.join(cheminEvents, file));
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        console.log(`🔍 Événement chargé : ${event.name}`);
    });
}

client.once('ready', () => {
    console.log(`🦊 UpFox connecté [${client.user.tag}]`);
});

// 4. Serveur Web
console.log("🌐 [DEBUG] Étape 5 : Création du serveur HTTP...");
const portEcoute = process.env.PORT || 3000;
const serveurWeb = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🤖 UpFox Actif');
});

serveurWeb.listen(portEcoute, '0.0.0.0', () => {
    console.log(`🌐 Serveur Web en ligne sur le port ${portEcoute}`);
});

// 5. Connexion
console.log("🔑 [DEBUG] Étape 6 : Tentative de login auprès de Discord...");
client.login(process.env.DISCORD_TOKEN);