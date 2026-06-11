const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription(
            'Envoyer un message'
        )
        .addStringOption(option =>
            option
                .setName('contenu')
                .setDescription(
                    'Texte à envoyer'
                )
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ManageMessages
        ),

    async execute(interaction) {
        const contenu =
            interaction.options.getString(
                'contenu'
            );

        await interaction.channel.send(
            contenu
        );

        await interaction.reply({
            content: '✅ Message envoyé.',
            ephemeral: true
        });
    }
};