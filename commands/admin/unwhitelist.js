const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unwhitelist')
        .setDescription('Retirer à la whitelist')
        .addMentionableOption(option =>
            option
                .setName('cible')
                .setDescription('Membre ou rôle à ne plus protéger')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {
        const cible =
            interaction.options.getMentionable('cible');

        await interaction.reply({
            content: `✅ ${cible} a été retiré à la whitelist.`,
            ephemeral: false
        });
    }
};