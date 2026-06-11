// commands/admin/react.js
module.exports = {
    name: 'react',
    async execute(interaction) {
        // 1. Récupération des données saisies par l'administrateur
        const idMessage = interaction.options.getString('message_id');
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');

        try {
            // 2. On cherche le message spécifiquement dans le salon où la commande est tapée
            const messageCible = await interaction.channel.messages.fetch(idMessage);

            // 3. Le bot ajoute la réaction pour "amorcer" le bouton
            await messageCible.react(emoji);

            // 4. On paramètre le filtre et le collecteur sur CE message précis
            const filtreReactions = (reaction, user) => reaction.emoji.name === emoji && !user.bot;
            
            // dispose: true permet de détecter quand quelqu'un RETIRE sa réaction
            const collecteurReactions = messageCible.createReactionCollector({ filter: filtreReactions, dispose: true });

            // Événement : Quelqu'un AJOUTE sa réaction
            collecteurReactions.on('collect', async (reaction, utilisateur) => {
                try {
                    const membreGuilde = await interaction.guild.members.fetch(utilisateur.id);
                    await membreGuilde.roles.add(role.id);
                } catch (err) {
                    console.error("Impossible d'ajouter le rôle :", err.message);
                }
            });

            // Événement : Quelqu'un RETIRE sa réaction
            collecteurReactions.on('remove', async (reaction, utilisateur) => {
                try {
                    const membreGuilde = await interaction.guild.members.fetch(utilisateur.id);
                    await membreGuilde.roles.remove(role.id);
                } catch (err) {
                    console.error("Impossible de retirer le rôle :", err.message);
                }
            });

            // 5. On confirme à l'administrateur que tout est prêt (message masqué)
            await interaction.reply({ 
                content: `✅ Le système Reaction-Role a été attaché avec succès au message **${idMessage}** !`, 
                ephemeral: true 
            });

        } catch (error) {
            // Si le message est introuvable (mauvais ID ou supprimé)
            await interaction.reply({ 
                content: `❌ Impossible de trouver le message avec l'ID **${idMessage}**. Vérifiez qu'il se trouve bien dans **ce salon** et que le mode développeur est activé pour copier le bon ID.`, 
                ephemeral: true 
            });
            console.error("Erreur commande /react :", error.message);
        }
    }
};