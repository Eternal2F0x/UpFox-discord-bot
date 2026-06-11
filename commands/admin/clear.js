const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Supprimer des messages')
        .addIntegerOption(option =>
            option
                .setName('nombre')
                .setDescription('1 à 99')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    async execute(interaction) {
        const nombre =
            interaction.options.getInteger(
                'nombre'
            );

        await interaction.channel.bulkDelete(
            nombre,
            true
        );

        await interaction.reply({
            content: `🗑️ ${nombre} messages supprimés.`,
            ephemeral: true
        });
    }
};