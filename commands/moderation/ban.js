const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bannir un membre')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Membre à bannir')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers
        ),

    async execute(interaction) {
        const cible = interaction.options.getMember('membre');

        if (!cible) {
            return interaction.reply({
                content: '❌ Membre introuvable.',
                ephemeral: true
            });
        }

        await cible.ban({
            reason: 'Banni via /ban'
        });

        await interaction.reply(
            `🔨 **${cible.user.tag}** a été banni définitivement.`
        );
    }
};