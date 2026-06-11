// deploy-commands.js
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const commands = [
    // Public
    new SlashCommandBuilder().setName('hello').setDescription('Salue le bot de manière interactive.'),
    new SlashCommandBuilder().setName('roll').setDescription('Simule le lancer d\'un dé à 6 faces.'),
    new SlashCommandBuilder().setName('uphelp').setDescription('Affiche le centre d\'aide dynamique (Visible uniquement par vous).'),

    // Moderation
    new SlashCommandBuilder().setName('warn').setDescription('Donne un avertissement à un membre.').addUserOption(o => o.setName('membre').setDescription('Le membre à avertir').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName('unwarn').setDescription('Remet à zéro les avertissements d\'un membre.').addUserOption(o => o.setName('membre').setDescription('Le membre à gracier').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName('mute').setDescription('Exclut temporairement un membre du serveur (10 minutes).').addUserOption(o => o.setName('membre').setDescription('Le membre à réduire au silence').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName('unmute').setDescription('Annule l\'exclusion temporaire d\'un membre.').addUserOption(o => o.setName('membre').setDescription('Le membre à rétablir').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder().setName('kick').setDescription('Expulse un membre du serveur.').addUserOption(o => o.setName('membre').setDescription('Le membre à expulser').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    new SlashCommandBuilder().setName('ban').setDescription('Bannit définitivement un membre du serveur.').addUserOption(o => o.setName('membre').setDescription('Le membre à bannir').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    new SlashCommandBuilder().setName('muteall').setDescription('Bloque ou débloque l\'envoi de messages.').addBooleanOption(o => o.setName('verrouiller').setDescription('True pour bloquer, False pour débloquer').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    // Admin
    new SlashCommandBuilder().setName('clear').setDescription('Supprime un nombre défini de messages.').addIntegerOption(o => o.setName('nombre').setDescription('Nombre de messages (1-99)').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('whitelist').setDescription('Immunise un membre ou un rôle contre l\'AutoMod.').addMentionableOption(o => o.setName('cible').setDescription('Le membre ou le rôle à immuniser').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('unwhitelist').setDescription('Retire l\'immunité AutoMod.').addMentionableOption(o => o.setName('cible').setDescription('L\'élément à soumettre à nouveau').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('react').setDescription('Configure un message de Reaction-Role.').addRoleOption(o => o.setName('role').setDescription('Le rôle à attribuer').setRequired(true)).addStringOption(o => o.setName('emoji').setDescription('L\'emoji de réaction').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log("🔄 Force l'enregistrement global des raccourcis auprès de Discord...");
        // Utilisation explicite du Client ID de ton application
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Raccourcis synchronisés sur TOUS les serveurs ! (Peut prendre quelques minutes à apparaître partout).");
    } catch (error) {
        console.error("❌ Erreur de déploiement :", error);
    }
})();