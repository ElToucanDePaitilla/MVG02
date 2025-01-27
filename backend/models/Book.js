const mongoose = require('mongoose');

// Définition du SCHEMA pour les livres
const bookSchema = mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    imageUrl: { type: String, required: true },
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    ratings: [ // Tableau des notes attribuées au livre
        {
            userId: { type: String, required: true },
            grade: { type: Number, required: true }// Note donnée au livre
        }
    ],
    averageRating: { type: Number, default: 0 } // Note moyenne calculée
});

// Exportation du MODELE Book basé sur le schéma défini
module.exports = mongoose.model('Book', bookSchema);

