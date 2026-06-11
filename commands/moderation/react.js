// commands/moderation/react.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'react',
    data: new SlashCommandBuilder()
        .setName('react')
        .setDescription('Configure une réaction pour donner un rôle')
        .addRoleOption(option => 
            option.setName('role').setDescription('Le rôle à donner').setRequired(true))
        .addStringOption(option => 
            option.setName('emoji').setDescription('L\'émoji de réaction').setRequired(true))
        .addStringOption(option => 
            option.setName('message_id').setDescription('L\'ID du message cible').setRequired(true))
        .addChannelOption(option => 
            option.setName('channel').setDescription('Le salon du message').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        const emoji = interaction.options.getString('emoji');
        const messageId = interaction.options.getString('message_id');
        const channel = interaction.options.getChannel('channel');

        try {
            // 1. Récupérer le message
            const targetMessage = await channel.messages.fetch(messageId);
            
            // 2. Réagir au message pour montrer que ça a fonctionné
            await targetMessage.react(emoji);

            // 3. Sauvegarder dans ton "client.state" (mémoire temporaire)
            // On utilise une Map : ID_Message -> { roleId, emoji }
            if (!interaction.client.state.reactRoles) {
                interaction.client.state.reactRoles = new Map();
            }
            interaction.client.state.reactRoles.set(messageId, { roleId: role.id, emoji: emoji });

            await interaction.reply({ 
                content: `✅ Configuration terminée ! Réagir avec ${emoji} donnera le rôle **${role.name}**.`, 
                ephemeral: true 
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '❌ Impossible de trouver le message ou de réagir.', ephemeral: true });
        }
    }
};