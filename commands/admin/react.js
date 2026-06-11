// commands/admin/react.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'react',
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');

        const embedReactionRole = new EmbedBuilder()
            .setTitle("🎭 Attribution Automatique de Rôle")
            .setDescription(`Réagissez avec l'emoji ${emoji} pour obtenir ou retirer le rôle **${role.name}** !`)
            .setColor('#3498DB');

        // Correction ici : On envoie d'abord la réponse
        await interaction.reply({ embeds: [embedReactionRole] });
        
        // On récupère le message que Discord vient de générer pour y placer l'émoji automatiquement
        const messageOriginal = await interaction.fetchReply();
        await messageOriginal.react(emoji).catch(() => console.log("Impossible de réagir avec cet émoji."));

        const filtreReactions = (reaction, user) => reaction.emoji.name === emoji && !user.bot;
        const collecteurReactions = messageOriginal.createReactionCollector({ filter: filtreReactions, dispose: true });

        collecteurReactions.on('collect', async (reaction, utilisateur) => {
            const membreGuilde = await interaction.guild.members.fetch(utilisateur.id);
            await membreGuilde.roles.add(role.id).catch(() => {});
        });

        collecteurReactions.on('remove', async (reaction, utilisateur) => {
            const membreGuilde = await interaction.guild.members.fetch(utilisateur.id);
            await membreGuilde.roles.remove(role.id).catch(() => {});
        });
    }
};