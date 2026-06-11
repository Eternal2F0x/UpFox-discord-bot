const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Retire le Timeout')
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
            null
        );

        await interaction.reply(
            `🔇 **${cible.user.tag}** n'est plus exclus temporairement.`
        );
    }
};