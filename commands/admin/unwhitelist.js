// commands/admin/unwhitelist.js
module.exports = {
    name: 'unwhitelist',
    async execute(interaction) {
        const cible = interaction.options.getMentionable('cible');
        interaction.client.state.listeBlancheAutoMod.delete(cible.id);
        await interaction.reply(`🚫 **${cible.user?.tag || cible.name}** est de nouveau soumis à l'AutoMod.`);
    }
};