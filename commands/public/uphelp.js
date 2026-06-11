// commands/public/uphelp.js
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'uphelp',
    async execute(interaction) {
        const { guild, member } = interaction;
        
        // Sécurité anti-crash si exécuté en DM
        const estModérateur = guild && member ? member.permissions.has(PermissionFlagsBits.ManageMessages) : false;
        const estAdministrateur = guild && member ? member.permissions.has(PermissionFlagsBits.Administrator) : false;

        const embedHelp = new EmbedBuilder()
            .setTitle("🦊 Centre d'Aide UpFox")
            .setDescription("Liste des commandes disponibles adaptées à votre profil.")
            .setColor('#2ECC71')
            .addFields({ name: "👤 Commandes Publiques", value: "`/hello` - Saluer le bot\n`/roll` - Lancer un dé\n`/uphelp` - Ce menu" });

        if (estModérateur || estAdministrateur) {
            embedHelp.addFields({ 
                name: "⚔️ Modération Staff", 
                value: "`/warn` - Donner un avertissement\n`/unwarn` - Reset les infractions\n`/mute` - Rendre muet 10min\n`/unmute` - Annuler le mute\n`/kick` - Expulser\n`/ban` - Bannir\n`/muteall` - Verrouiller un salon" 
            });
        }

        if (estAdministrateur) {
            embedHelp.addFields({ 
                name: "⚙️ Administration Pro", 
                value: "`/clear` - Nettoyer le salon\n`/whitelist` - Immuniser un rôle/membre\n`/unwhitelist` - Retirer l'immunité\n`/react` - Créer un Reaction-Role" 
            });
        }

        await interaction.reply({ embeds: [embedHelp], ephemeral: true });
    }
};