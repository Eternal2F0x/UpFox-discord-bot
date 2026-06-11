// commands/moderation/muteall.js
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'muteall',
    async execute(interaction) {
        const verrouiller = interaction.options.getBoolean('verrouiller');

        await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: !verrouiller
        });
        await interaction.reply(verrouiller ? "🔒 Salon verrouillé (MuteAll activé)." : "🔓 Salon déverrouillé (MuteAll désactivé).");
    }
};