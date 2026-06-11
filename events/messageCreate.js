// events/messageCreate.js
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../utils/databaseManager');

const trackingSpamMembres = new Map();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot || !message.guild) return;

        const donnees = db.lire();
        const estModérateur = message.member.permissions.has(PermissionFlagsBits.ManageMessages);
        const estImmunise = donnees.liste_blanche.includes(message.author.id) || 
                            message.member.roles.cache.some(r => donnees.liste_blanche.includes(r.id));

        if (estModérateur || estImmunise) return;

        const instantT = Date.now();

        // --- A. ANTI-SPAM ---
        if (!trackingSpamMembres.has(message.author.id)) trackingSpamMembres.set(message.author.id, []);
        const historiques = trackingSpamMembres.get(message.author.id);
        historiques.push(instantT);
        const fenetre = historiques.filter(t => instantT - t < 4000);
        trackingSpamMembres.set(message.author.id, fenetre);

        if (fenetre.length > 4) {
            await message.delete().catch(() => {});
            const alert = await message.channel.send(`⚠️ ${message.author}, ralentissez la cadence !`);
            setTimeout(() => alert.delete().catch(() => {}), 4000);
            return;
        }

        // --- B. DETECTION DES INSULTES AUTOMATISÉE VIA JSON ---
        // On normalise le texte : suppression des accents, des points et espaces internes
        const messageNormalise = message.content
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Supprime les accents (é -> e)
            .replace(/[^a-z0-9]/g, ""); // Supprime espaces, points, tirets (m.e.r.d.e -> merde)

        const listeMotsProscrits = donnees.config.mots_interdits;
        
        if (listeMotsProscrits.some(mot => messageNormalise.includes(mot))) {
            await message.delete().catch(() => {});
            
            const logsSalon = await message.client.channels.fetch(donnees.config.salons.logs_moderation).catch(() => null);
            if (logsSalon) {
                const embed = new EmbedBuilder()
                    .setTitle("🛡️ Auto-Mod : Message Bloqué")
                    .setColor('#FF9900')
                    .addFields(
                        { name: "Auteur", value: `${message.author}`, inline: true },
                        { name: "Contenu", value: message.content }
                    )
                    .setTimestamp();
                await logsSalon.send({ embeds: [embed] });
            }
            return;
        }

        // --- C. CAPSLOCK ---
        if (message.content.length > 8) {
            const lettres = message.content.replace(/[^a-zA-Z]/g, '');
            if (lettres.length > 0) {
                const majuscules = lettres.replace(/[^A-Z]/g, '');
                if ((majuscules.length / lettres.length) > 0.70) {
                    await message.delete().catch(() => {});
                }
            }
        }
    }
};