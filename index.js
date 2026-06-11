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

// commands/admin/react.js
module.exports = {
    name: 'react',
    async execute(interaction) {
        // 1. Récupération des données saisies par l'administrateur
        const idMessage = interaction.options.getString('message_id');
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');

        try {
            // 2. On cherche le message spécifiquement dans le salon où la commande est tapée
            const messageCible = await interaction.channel.messages.fetch(idMessage);

            // 3. Le bot ajoute la réaction pour "amorcer" le bouton
            await messageCible.react(emoji);

            // 4. On paramètre le filtre et le collecteur sur CE message précis
            const filtreReactions = (reaction, user) => reaction.emoji.name === emoji && !user.bot;
            
            // dispose: true permet de détecter quand quelqu'un RETIRE sa réaction
            const collecteurReactions = messageCible.createReactionCollector({ filter: filtreReactions, dispose: true });

            // Événement : Quelqu'un AJOUTE sa réaction
            collecteurReactions.on('collect', async (reaction, utilisateur) => {
                try {
                    const membreGuilde = await interaction.guild.members.fetch(utilisateur.id);
                    await membreGuilde.roles.add(role.id);
                } catch (err) {
                    console.error("Impossible d'ajouter le rôle :", err.message);
                }
            });

            // Événement : Quelqu'un RETIRE sa réaction
            collecteurReactions.on('remove', async (reaction, utilisateur) => {
                try {
                    const membreGuilde = await interaction.guild.members.fetch(utilisateur.id);
                    await membreGuilde.roles.remove(role.id);
                } catch (err) {
                    console.error("Impossible de retirer le rôle :", err.message);
                }
            });

            // 5. On confirme à l'administrateur que tout est prêt (message masqué)
            await interaction.reply({ 
                content: `✅ Le système Reaction-Role a été attaché avec succès au message **${idMessage}** !`, 
                ephemeral: true 
            });

        } catch (error) {
            // Si le message est introuvable (mauvais ID ou supprimé)
            await interaction.reply({ 
                content: `❌ Impossible de trouver le message avec l'ID **${idMessage}**. Vérifiez qu'il se trouve bien dans **ce salon** et que le mode développeur est activé pour copier le bon ID.`, 
                ephemeral: true 
            });
            console.error("Erreur commande /react :", error.message);
        }
    }
};