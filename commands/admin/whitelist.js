// commands/admin/whitelist.js
module.exports = {
    name: 'whitelist',
    async execute(interaction) {
        const cible = interaction.options.getMentionable('cible');
        interaction.client.state.listeBlancheAutoMod.add(cible.id);
        await interaction.reply(`✅ **${cible.user?.tag || cible.name}** est désormais immunisé contre l'AutoMod.`);
    }
};