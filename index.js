// commands/public/hello.js
module.exports = {
    name: 'hello',
    async execute(interaction) {
        await interaction.reply({ 
            content: `👋 Salut à toi, ${interaction.user} !`, 
            ephemeral: true 
        });
    }
};