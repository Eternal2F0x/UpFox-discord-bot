// commands/public/message.js
module.exports = {
    name: 'message',
    async execute(interaction) {
        const contenu = interaction.options.getString('contenu');
        // On envoie le message dans le salon actuel
        await interaction.channel.send(contenu);
        // On répond discrètement à l'auteur pour ne pas polluer le salon
        await interaction.reply({ content: "✅ Message envoyé avec succès !", ephemeral: true });
    }
};