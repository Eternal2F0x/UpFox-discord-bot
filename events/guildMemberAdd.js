// events/guildMemberAdd.js
const db = require('../utils/databaseManager');

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    async execute(membre) {
        const donneesDB = db.lire();
        
        // Sécurité : on vérifie que la base de données est bien structurée
        if (!donneesDB || !donneesDB.config || !donneesDB.config.salons.bienvenue) return;

        const idSalon = donneesDB.config.salons.bienvenue;

        try {
            const salonBienvenue = await membre.guild.channels.fetch(idSalon);
            if (salonBienvenue) {
                await salonBienvenue.send(`🦊 Bienvenue au sein du clan, ${membre} ! Prend une chope 🍺 et amuse-toi bien parmi nous.`);
            }
        } catch (error) {
            // Gestion des erreurs spécifiques à l'API Discord
            if (error.code === 50013) {
                console.error(`🚨 [Auto-Modération] Permission refusée : Le bot n'a pas le droit d'écrire dans le salon de bienvenue (${idSalon}). Vérifiez les rôles Discord.`);
            } else if (error.code === 10003) {
                console.error(`❌ [Erreur] Le salon de bienvenue (ID: ${idSalon}) n'existe plus. Mettez à jour votre base de données.`);
            } else {
                console.error(`💥 Erreur inattendue lors de l'arrivée d'un membre :`, error);
            }
        }
    }
};