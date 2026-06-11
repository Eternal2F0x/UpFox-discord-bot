const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hello')
        .setDescription('Dire bonjour'),

    async execute(interaction) {
        await interaction.reply(
            `👋 Salut ${interaction.user}!`
        );
    }
};