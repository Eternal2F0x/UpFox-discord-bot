const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Timeout 10 minutes')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Membre concerné')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.ModerateMembers
        ),

    async execute(interaction) {
        const cible =
            interaction.options.getMember(
                'membre'
            );

        if (!cible) {
            return interaction.reply({
                content:
                    '❌ Membre introuvable.',
                ephemeral: true
            });
        }

        await cible.timeout(
            10 * 60 * 1000,
            'Sanction'
        );

        await interaction.reply(
            `🔇 **${cible.user.tag}** est exclu temporairement pendant 10 minutes.`
        );
    }
};