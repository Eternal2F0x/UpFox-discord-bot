// events/interactionCreate.js
module.exports = {
    name: 'interactionCreate',
    once: false,
    async execute(interaction) {
        // On ne traite que les Slash Commands
        if (!interaction.isChatInputCommand()) return;

        const commande = interaction.client.commands.get(interaction.commandName);
        if (!commande) return;

        try {
            await commande.execute(interaction);
        } catch (error) {
            console.error(`Erreur lors de l'exécution de /${interaction.commandName}:`, error);
            // Sécurité : si la commande a planté au milieu, on informe l'utilisateur sans crash global
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: '❌ Une erreur est survenue lors de l\'exécution.', ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'exécution.', ephemeral: true }).catch(() => {});
            }
        }
    }
};