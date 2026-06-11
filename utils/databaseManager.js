// utils/databaseManager.js
const fs = require('fs');
const path = require('path');
const cheminFichier = path.join(__dirname, '../data/database.json');

module.exports = {
    lire() {
        try {
            const data = fs.readFileSync(cheminFichier, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error("Erreur de lecture JSON:", error);
            return {};
        }
    },
    ecrire(donnees) {
        try {
            fs.writeFileSync(cheminFichier, JSON.stringify(donnees, null, 2), 'utf-8');
        } catch (error) {
            console.error("Erreur d'écriture JSON:", error);
        }
    }
};