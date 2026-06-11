// events/guildMemberRemove.js
const db = require('../utils/databaseManager');

module.exports = {
    name: 'guildMemberRemove',
    once: false,
    async execute(membre) {
        const donneesDB = db.lire();
        
        if (!donneesDB || !donneesDB.config || !donneesDB.config.salons.bienvenue) return;

        const idSalon = donneesDB.config.salons.bienvenue;

        try {
            const salonBienvenue = await membre.guild.channels.fetch(idSalon);
            if (salonBienvenue) {
                await salonBienvenue.send(`🍂 **${membre.user.tag}** a quitté le terrier. Bonne continuation à lui.`);
            }
        } catch (error) {
            if (error.code === 50013) {
                console.error(`🚨 [Auto-Modération] Permission refusée : Le bot n'a pas le droit d'écrire dans le salon de départ (${idSalon}). Vérifiez les rôles Discord.`);
            } else if (error.code === 10003) {
                console.error(`❌ [Erreur] Le salon de départ (ID: ${idSalon}) n'existe plus. Mettez à jour votre base de données.`);
            } else {
                console.error(`💥 Erreur inattendue lors du départ d'un membre :`, error);
            }
        }
    }
};