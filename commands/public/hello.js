// commands/public/hello.js
module.exports = {
    name: 'hello',
    async execute(interaction) {
        await interaction.reply(`🦊 Bonjour ${interaction.user} ! Comment se porte le clan aujourd'hui ?`);
    }
};