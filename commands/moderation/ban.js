// commands/moderation/ban.js
module.exports = {
    name: 'ban',
    async execute(interaction) {
        const cible = interaction.options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        await cible.ban({ reason: "Banni via /ban" }).catch(() => {});
        await interaction.reply(`🔨 **${cible.user.tag}** a été banni définitivement.`);
    }
};