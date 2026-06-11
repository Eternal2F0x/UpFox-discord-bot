// commands/moderation/unmute.js
module.exports = {
    name: 'unmute',
    async execute(interaction) {
        const cible = interaction.options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        await cible.timeout(null).catch(() => {});
        await interaction.reply(`🔊 Exclusion annulée pour **${cible.user.tag}**.`);
    }
};