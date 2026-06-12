const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 1. Configuration Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// 2. State & Collections
client.commands = new Collection();
client.state = {
    listeBlancheAutoMod: new Set(),
    membresAvertisCount: new Map(),
    reactRoles: new Map()
};

// 3. Sécurité : Gestion des erreurs globales
process.on('unhandledRejection', error => console.error('❌ Erreur non gérée:', error));
process.on('uncaughtException', error => console.error('❌ Exception non capturée:', error));

async function init() {
    console.log("🚀 Démarrage d'UpFox...");

    // A. Chargement des Commandes
    const commandsToRegister = [];
    const categories = ['public', 'moderation', 'admin'];

    // Remplace ta boucle de chargement de commandes par celle-ci :
    for (const cat of categories) {
        const dir = path.join(__dirname, 'commands', cat);
        if (!fs.existsSync(dir)) continue;

        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
        for (const file of files) {
            try {
                const cmd = require(path.join(dir, file));
                
                // Logique de récupération du nom de commande
                const commandName = (cmd.data && cmd.data.name) ? cmd.data.name : cmd.name;
                
                if (!commandName) {
                    console.warn(`⚠️ Commande ignorée (pas de nom) dans : ${file}`);
                    continue;
                }

                client.commands.set(commandName, cmd);
                if (cmd.data) commandsToRegister.push(cmd.data.toJSON());
                
                console.log(`✅ Commande chargée : ${commandName}`);
            } catch (err) {
                console.error(`❌ Erreur chargement commande ${file} :`, err);
            }
        }
    }

    // B. Enregistrement API (Slash Commands)
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    try {
        console.log(`🔄 Enregistrement de ${commandsToRegister.length} commandes...`);
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commandsToRegister },
        );
        console.log('✅ Commandes enregistrées avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement API :', error);
    }

    // C. Chargement Événements
    const eventsDir = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.js'));
    
    for (const file of eventFiles) {
        try {
            const event = require(path.join(eventsDir, file));
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
            console.log(`✅ Événement chargé : ${event.name}`);
        } catch (err) {
            console.error(`❌ Erreur chargement événement ${file} :`, err);
        }
    }

    // D. Serveur HTTP (pour rester en vie sur Render)
    const server = http.createServer((req, res) => res.end('UpFox OK'));
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`🌐 Serveur Web en écoute sur port ${PORT}`));

    // E. Connexion
    await client.login(process.env.DISCORD_TOKEN);
    console.log(`🦊 UpFox connecté en tant que ${client.user.tag}`);
}

init();