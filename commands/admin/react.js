// commands/admin/react.js
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'react',
    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const emoji = interaction.getString('emoji');

        const embedReactionRole = new EmbedBuilder()
            .setTitle("🎭 Attribution Automatique de Rôle")
            .setDescription(`Réagissez avec l'emoji ${emoji} pour obtenir ou retirer le rôle **${role.name}** !`)
            .setColor('#3498DB');

        // Récupération de la réponse brute pour pouvoir y coller une réaction
        const messageEnvoye = await interaction.reply({ embeds: [embedReactionRole], fetchReply: true });
        await messageEnvoye.react(emoji);

        const filtreReactions = (reaction, user) => reaction.emoji.name === emoji && !user.bot;
        const collecteurReactions = messageEnvoye.createReactionCollector({ filter: filtreReactions, dispose: true });

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