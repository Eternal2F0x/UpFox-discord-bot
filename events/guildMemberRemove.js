// events/guildMemberRemove.js
const db = require('../utils/databaseManager');

module.exports = {
    name: 'guildMemberRemove',
    once: false, // S'exécute à chaque fois qu'un membre part
    async execute(membre) {
        const donneesDB = db.lire();
        const idSalon = donneesDB.config.salons.bienvenue;

        const salonBienvenue = await membre.guild.channels.fetch(idSalon).catch(() => null);
        if (salonBienvenue) {
            await salonBienvenue.send(`🍂 **${membre.user.tag}** a quitté le terrier. Bonne continuation à lui.`);
        }
    }
};