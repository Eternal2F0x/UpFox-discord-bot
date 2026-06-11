// commands/moderation/warn.js
module.exports = {
    name: 'warn',
    async execute(interaction) {
        const cible = interaction.options.getMember('membre');
        if (!cible) return interaction.reply({ content: "❌ Membre introuvable.", ephemeral: true });

        const { membresAvertisCount } = interaction.client.state;
        let infractions = (membresAvertisCount.get(cible.id) || 0) + 1;
        membresAvertisCount.set(cible.id, infractions);

        if (infractions >= 3) {
            await cible.kick("Cumul de 3 avertissements (Automatique)").catch(() => {});
            membresAvertisCount.set(cible.id, 0);
            await interaction.reply(`🚨 **${cible.user.tag}** a été expulsé après son 3ème avertissement.`);
        } else {
            await interaction.reply(`⚠️ **${cible.user.tag}** a reçu un avertissement (${infractions}/3).`);
        }
    }
};