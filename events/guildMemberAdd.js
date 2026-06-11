// events/guildMemberAdd.js
const db = require('../utils/databaseManager');

module.exports = {
    name: 'guildMemberAdd',
    once: false, // S'exécute à chaque fois qu'un membre rejoint
    async execute(membre) {
        const donneesDB = db.lire();
        const idSalon = donneesDB.config.salons.bienvenue;

        const salonBienvenue = await membre.guild.channels.fetch(idSalon).catch(() => null);
        if (salonBienvenue) {
            await salonBienvenue.send(`🦊 Bienvenue au sein du clan, ${membre} ! Amuse-toi bien parmi nous.`);
        }
    }
};