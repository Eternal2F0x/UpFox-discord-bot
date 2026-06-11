// commands/public/hello.js
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'hello',
    async execute(interaction) {
        // L'utilisation de MessageFlags.Ephemeral remplace l'ancien "ephemeral: true"
        // Cela permet de corriger le Warning "deprecated" dans ton terminal.
        await interaction.reply({ 
            content: `👋 Salut à toi, ${interaction.user} !`, 
            flags: MessageFlags.Ephemeral 
        });
        
        // Attention : Ne rajoute AUCUN autre "await interaction.reply()" en dessous de cette ligne.
        // Si tu as besoin d'envoyer un autre message à la suite, utilise :
        // await interaction.followUp({ content: "Un autre message !", flags: MessageFlags.Ephemeral });
    }
};