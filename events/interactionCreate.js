module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Log immédiat pour savoir si ça déclenche
        console.log(`[TEST] Interaction reçue de : ${interaction.user.tag}`);
        console.log(`[TEST] Commande : ${interaction.commandName}`);

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        
        if (!command) {
            console.log(`[ERREUR] Commande non trouvée dans la collection : ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error('[ERREUR EXÉCUTION]', error);
        }
    }
};