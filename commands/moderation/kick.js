// commands/moderation/kick.js
module.exports = {
    name: 'kick',
    async execute(interaction) {
        const cible = interaction.options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        await cible.kick("Expulsé via /kick").catch(() => {});
        await interaction.reply(`🥾 **${cible.user.tag}** a été expulsé.`);
    }
};