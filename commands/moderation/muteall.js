const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    // 1. Définition de la commande pour l'API Discord
    data: new SlashCommandBuilder()
        .setName('muteall')
        .setDescription('Verrouille ou déverrouille le salon actuel pour tout le monde')
        .addBooleanOption(option => 
            option.setName('verrouiller')
                .setDescription('Vrai pour verrouiller, Faux pour déverrouiller')
                .setRequired(true))
        // 2. Sécurité : restreindre aux modérateurs directement dans l'API
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const verrouiller = interaction.options.getBoolean('verrouiller');

        // 3. Application de la modification
        try {
            await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
                SendMessages: !verrouiller
            });
            
            await interaction.reply({ 
                content: verrouiller ? "🔒 Salon verrouillé (MuteAll activé)." : "🔓 Salon déverrouillé (MuteAll désactivé).",
                ephemeral: false 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "❌ Une erreur est survenue lors du changement des permissions.", ephemeral: true });
        }
    }
};