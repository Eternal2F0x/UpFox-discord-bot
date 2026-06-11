// utils/youtube.js
const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const db = require('./databaseManager');

module.exports = {
    async execute(client) {
        const donneesDB = db.lire();

        try {
            const reponseYT = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    key: process.env.YOUTUBE_API_KEY,
                    channelId: process.env.YOUTUBE_CHANNEL_ID,
                    part: 'snippet,id',
                    order: 'date',
                    maxResults: 1
                }
            });

            const elements = reponseYT.data.items;
            if (!elements || elements.length === 0) return;

            const derniereVideo = elements[0];
            if (derniereVideo.id.kind !== 'youtube#video') return;

            const idVideoActuelle = derniereVideo.id.videoId;
            const salonAnnonces = await client.channels.fetch(donneesDB.config.salons.annonces).catch(() => null);
            let identifiantDerniereVideoYT = donneesDB.etats_externes.identifiantDerniereVideoYT;

            // Initialisation au tout premier lancement si le JSON est vide
            if (!identifiantDerniereVideoYT) {
                donneesDB.etats_externes.identifiantDerniereVideoYT = idVideoActuelle;
                db.ecrire(donneesDB);
                return;
            }

            // Si l'ID récupéré est différent de celui stocké dans le JSON, c'est une nouvelle vidéo
            if (idVideoActuelle !== identifiantDerniereVideoYT) {
                donneesDB.etats_externes.identifiantDerniereVideoYT = idVideoActuelle;
                db.ecrire(donneesDB); // Sauvegarde de la nouvelle vidéo de référence

                if (salonAnnonces) {
                    const embedYouTube = new EmbedBuilder()
                        .setTitle(`🎥 Nouvelle vidéo de ${derniereVideo.snippet.channelTitle} !`)
                        .setDescription(derniereVideo.snippet.title)
                        .setURL(`https://www.youtube.com/watch?v=${idVideoActuelle}`)
                        .setColor('#FF0000')
                        .setImage(derniereVideo.snippet.thumbnails.high.url)
                        .setTimestamp();

                    await salonAnnonces.send({ content: `🔔 Nouvelle vidéo disponible !`, embeds: [embedYouTube] });
                }
            }
        } catch (error) {
            console.error("❌ Erreur lors du traitement API YouTube Data v3 :", error.message);
        }
    }
};