// commands/moderation/mute.js
module.exports = {
    name: 'mute',
    async execute(interaction) {
        const cible = interaction.options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        // Timeout natif Discord de 10 minutes
        await cible.timeout(10 * 60 * 1000, "Sanction via /mute").catch(() => {});
        await interaction.reply(`🔇 **${cible.user.tag}** a été exclu temporairement pour 10 minutes.`);
    }
};