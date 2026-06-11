// commands/moderation/unwarn.js
module.exports = {
    name: 'unwarn',
    async execute(interaction) {
        const cible = interaction.options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        interaction.client.state.membresAvertisCount.set(cible.id, 0);
        await interaction.reply(`✅ Les avertissements de **${cible.user.tag}** ont été remis à zéro.`);
    }
};