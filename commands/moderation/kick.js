const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulser un membre')
        .addUserOption(option =>
            option
                .setName('membre')
                .setDescription('Membre à expulser')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.KickMembers
        ),

    async execute(interaction) {
        const cible = interaction.options.getMember('membre');

        if (!cible) {
            return interaction.reply({
                content: '❌ Membre introuvable.',
                ephemeral: true
            });
        }

        await cible.kick('Expulsé via /kick');

        await interaction.reply(
            `🥾 **${cible.user.tag}** a été expulsé.`
        );
    }
};