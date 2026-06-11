// commands/admin/clear.js
module.exports = {
    name: 'clear',
    async execute(interaction) {
        const nombreDeMessages = interaction.options.getInteger('nombre');

        if (nombreDeMessages < 1 || nombreDeMessages > 99) {
            return await interaction.reply({ content: "❌ Indiquez un nombre entre 1 et 99.", ephemeral: true });
        }

        await interaction.reply({ 
            content: `⚠️ Confirmez la suppression de **${nombreDeMessages}** messages en tapant \`!ok\` ou \`!cancel\`.`, 
            ephemeral: false 
        });

        const filtreConfirmation = response => response.author.id === interaction.user.id && ['!ok', '!cancel'].includes(response.content.toLowerCase());
        const collector = interaction.channel.createMessageCollector({ filter: filtreConfirmation, time: 15000, max: 1 });

        collector.on('collect', async (reponseMessage) => {
            if (reponseMessage.content.toLowerCase() === '!ok') {
                try {
                    const messagesDuSalon = await interaction.channel.messages.fetch({ limit: nombreDeMessages + 1 });
                    const limite14Jours = Date.now() - (14 * 24 * 60 * 60 * 1000);
                    const messagesSupprimables = messagesDuSalon.filter(msg => msg.createdTimestamp > limite14Jours);
                    
                    if (messagesSupprimables.size > 0) {
                        await interaction.channel.bulkDelete(messagesSupprimables);
                    }

                    await interaction.editReply({ content: `🗑️ Nettoyage effectué avec succès !` });
                    await reponseMessage.delete().catch(() => {});
                    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
                } catch (error) {
                    console.error(error);
                    await interaction.followUp({ content: "❌ Erreur lors du bulkDelete.", ephemeral: true });
                }
            } else {
                await interaction.editReply({ content: "❌ Suppression annulée." });
                await reponseMessage.delete().catch(() => {});
                setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.editReply({ content: "⏱️ Temps écoulé. Suppression annulée." }).catch(() => {});
                setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
            }
        });
    }
};