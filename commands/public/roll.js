// commands/public/roll.js
module.exports = {
    name: 'roll',
    async execute(interaction) {
        const resultatDe = Math.floor(Math.random() * 6) + 1;
        await interaction.reply(`🎲 **${interaction.user.username}** lance un dé à 6 faces et obtient un **${resultatDe}** !`);
    }
};