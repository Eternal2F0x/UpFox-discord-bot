const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('whitelist')
        .setDescription('Ajouter à la whitelist')
        .addMentionableOption(option =>
            option
                .setName('cible')
                .setDescription('Membre ou rôle à protéger')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    async execute(interaction) {
        const cible =
            interaction.options.getMentionable('cible');

        await interaction.reply({
            content: `✅ ${cible} a été ajouté à la whitelist.`,
            ephemeral: true
        });
    }
};