const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Lancer un dé'),

    async execute(interaction) {
        const resultat =
            Math.floor(Math.random() * 6) + 1;

        await interaction.reply(
            `🎲 Résultat : ${resultat}`
        );
    }
};