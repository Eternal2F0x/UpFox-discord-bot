// deploy-commands.js
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder().setName('hello').setDescription('Salue le bot de manière interactive.'),
    new SlashCommandBuilder().setName('roll').setDescription('Simule le lancer d\'un dé à 6 faces.'),
    new SlashCommandBuilder().setName('uphelp').setDescription('Affiche le centre d\'aide dynamique.'),
    new SlashCommandBuilder()
        .setName('message')
        .setDescription('Fait répéter un message important au bot.')
        .addStringOption(o => o.setName('contenu').setDescription('Le texte à envoyer').setRequired(true)),

    // Moderation
    new SlashCommandBuilder().setName('warn').setDescription('Donne un avertissement.').addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName('unwarn').setDescription('Reset les avertissements.').addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName('mute').setDescription('Mute 10 minutes.').addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName('unmute').setDescription('Démute un membre.').addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName('kick').setDescription('Expulse un membre.').addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    new SlashCommandBuilder().setName('ban').setDescription('Bannit un membre.').addUserOption(o => o.setName('membre').setDescription('Le membre').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    new SlashCommandBuilder().setName('muteall').setDescription('Bloque/Débloque le salon.').addBooleanOption(o => o.setName('verrouiller').setDescription('True/False').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // Admin
    new SlashCommandBuilder().setName('clear').setDescription('Supprime des messages.').addIntegerOption(o => o.setName('nombre').setDescription('1-99').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('whitelist').setDescription('Immunise un membre/rôle.').addMentionableOption(o => o.setName('cible').setDescription('Cible').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('unwhitelist').setDescription('Retire l\'immunité.').addMentionableOption(o => o.setName('cible').setDescription('Cible').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder()
        .setName('react')
        .setDescription('Ajoute un Reaction-Role à un message existant.')
        .addStringOption(o => o.setName('message_id').setDescription('L\'ID du message cible (dans ce salon)').setRequired(true))
        .addRoleOption(o => o.setName('role').setDescription('Le rôle à donner/retirer').setRequired(true))
        .addStringOption(o => o.setName('emoji').setDescription('L\'emoji à utiliser').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) ].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("🔄 Enregistrement des raccourcis auprès de Discord...");
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
        console.log("✅ Raccourcis synchronisés !");
    } catch (error) { console.error(error); }
})();