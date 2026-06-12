const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('react')
        .setDescription('Configure un rôle par réaction')
        .addChannelOption(option => 
            option.setName('salon')
                .setDescription('Le salon où se trouve le message')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message_id')
                .setDescription('ID du message cible')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Le rôle à attribuer')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('emoji')
                .setDescription('L\'émoji à utiliser (ex: 🍎)')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const salon = interaction.options.getChannel('salon');
        const messageId = interaction.options.getString('message_id');
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');

        try {
            // 1. Récupération du message
            const message = await salon.messages.fetch(messageId);
            
            // 2. Ajout de la réaction par le bot
            await message.react(emoji);

            // 3. Stockage en mémoire (pour que le bot sache quel rôle donner plus tard)
            // Note : client.state.reactRoles est une Map définie dans index.js
            interaction.client.state.reactRoles.set(message.id, {
                roleId: role.id,
                emoji: emoji
            });

            await interaction.editReply({ 
                content: `✅ Réaction configurée ! Si quelqu'un clique sur ${emoji}, il recevra le rôle **${role.name}**.` 
            });

        } catch (error) {
            console.error('Erreur dans react.js :', error);
            await interaction.editReply({ 
                content: `❌ Impossible de configurer la réaction. Vérifiez que l'ID du message est correct et que j'ai la permission de voir le salon ${salon}.` 
            });
        }
    },
};