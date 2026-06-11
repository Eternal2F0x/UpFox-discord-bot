// index.js
const {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes
} = require('discord.js');

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

client.commands = new Collection();

client.state = {
    listeBlancheAutoMod: new Set(),
    membresAvertisCount: new Map(),
    reactRoles: new Map()
};

async function init() {
    console.log("🚀 [DEBUG] Démarrage d'UpFox...");

    const commandsToRegister = [];
    const categories = ['public', 'moderation', 'admin'];

    // Chargement des commandes
    for (const cat of categories) {
        const chemin = path.join(
            __dirname,
            'commands',
            cat
        );

        if (!fs.existsSync(chemin)) continue;

        const files = fs
            .readdirSync(chemin)
            .filter(file => file.endsWith('.js'));

        for (const file of files) {
            try {
                const cmd = require(
                    path.join(chemin, file)
                );

                if (!cmd.data) {
                    console.warn(
                        `⚠️ ${file} ne possède pas de propriété data`
                    );
                    continue;
                }

                client.commands.set(
                    cmd.data.name,
                    cmd
                );

                commandsToRegister.push(
                    cmd.data.toJSON()
                );

                console.log(
                    `✅ Commande chargée : ${cmd.data.name}`
                );
            } catch (err) {
                console.error(
                    `❌ Erreur dans ${file}`,
                    err
                );
            }
        }
    }

    console.log(
        `📦 ${commandsToRegister.length} commandes chargées`
    );

    // Enregistrement Discord
    const rest = new REST({
        version: '10'
    }).setToken(
        process.env.DISCORD_TOKEN
    );

    try {
        console.log(
            `🔄 Enregistrement de ${commandsToRegister.length} commandes...`
        );

        await rest.put(
            Routes.applicationCommands(
                process.env.CLIENT_ID
            ),
            {
                body: commandsToRegister
            }
        );

        console.log(
            '✅ Commandes enregistrées avec succès'
        );
    } catch (error) {
        console.error(
            '❌ Erreur enregistrement :',
            error
        );
    }

    // Chargement des événements
    const cheminEvents = path.join(
        __dirname,
        'events'
    );

    const eventFiles = fs
        .readdirSync(cheminEvents)
        .filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(
            path.join(cheminEvents, file)
        );

        if (event.once) {
            client.once(
                event.name,
                (...args) =>
                    event.execute(...args)
            );
        } else {
            client.on(
                event.name,
                (...args) =>
                    event.execute(...args)
            );
        }

        console.log(
            `📌 Événement chargé : ${event.name}`
        );
    }

    const serveurWeb = http.createServer(
        (req, res) => {
            res.end('UpFox OK');
        }
    );

    serveurWeb.listen(
        process.env.PORT || 3000,
        () => {
            console.log(
                '🌐 Serveur Web en ligne'
            );
        }
    );

    await client.login(
        process.env.DISCORD_TOKEN
    );

    console.log(
        `🦊 Connecté en tant que ${client.user.tag}`
    );
}

init().catch(console.error);