// utils/twitch.js
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const db = require('./databaseManager');

async function recupererJetonAuthentificationTwitch() {
    try {
        const reponseToken = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                grant_type: 'client_credentials'
            }
        });
        return reponseToken.data.access_token;
    } catch (err) {
        console.error("❌ Échec de génération du Token Twitch OAuth2 :", err.message);
        return null;
    }
}

module.exports = {
    async execute(client) {
        const jetonTwitch = await recupererJetonAuthentificationTwitch();
        if (!jetonTwitch) return;

        const donneesDB = db.lire();

        try {
            const reponseFlux = await axios.get('https://api.twitch.tv/helix/streams', {
                headers: {
                    'Client-ID': process.env.TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${jetonTwitch}`
                },
                params: { user_login: process.env.TWITCH_CHANNEL_NAME }
            });

            const donneesFlux = reponseFlux.data.data;
            const salonAnnonces = await client.channels.fetch(donneesDB.config.salons.annonces).catch(() => null);
            let statutDernierLiveTwitch = donneesDB.etats_externes.statutDernierLiveTwitch;

            if (donneesFlux.length > 0) {
                if (!statutDernierLiveTwitch) {
                    // Changement d'état détecté : Il passe en LIVE
                    donneesDB.etats_externes.statutDernierLiveTwitch = true;
                    db.ecrire(donneesDB); // Sauvegarde immédiate dans le JSON

                    const infoLive = donneesFlux[0];
                    
                    if (salonAnnonces) {
                        const embedTwitch = new EmbedBuilder()
                            .setTitle(`🦊 ${infoLive.user_name} est en LIVE sur Twitch !`)
                            .setDescription(`**Jeu :** ${infoLive.game_name}\n**Titre :** ${infoLive.title}`)
                            .setURL(`https://twitch.tv/${process.env.TWITCH_CHANNEL_NAME}`)
                            .setColor('#9146FF')
                            .setImage(infoLive.thumbnail_url.replace('{width}', '1280').replace('{height}', '720'))
                            .setTimestamp();

                        await salonAnnonces.send({ 
                            content: `📢 @everyone **${infoLive.user_name}** vient de lancer un stream !`, 
                            embeds: [embedTwitch] 
                        });
                    }
                }
            } else {
                if (statutDernierLiveTwitch) {
                    // Changement d'état détecté : Le live est coupé
                    donneesDB.etats_externes.statutDernierLiveTwitch = false;
                    db.ecrire(donneesDB);
                }
            }
        } catch (error) {
            console.error("❌ Erreur lors du scan API Twitch Helix :", error.message);
        }
    }
};