const fs = require('fs');
const path = require('path');
const Book = require('../models/Book'); // Modèle des livres

// Supprimer un livre et son fichier image associé
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        // Supprimer l'image associée au livre dans uploads
        const filePath = path.join(__dirname, '../uploads', book.image);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Supprime le fichier
        }

        // Supprimer le livre de la base de données
        await Book.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Livre supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour un livre avec une nouvelle image
exports.updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        // Supprimer l'ancienne image si elle existe
        if (req.file) {
            const oldFilePath = path.join(__dirname, '../uploads', book.image);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Mettre à jour le livre avec la nouvelle image
        book.title = req.body.title || book.title;
        book.author = req.body.author || book.author;
        book.image = req.file ? req.file.filename : book.image;
        await book.save();

        res.status(200).json({ message: 'Livre mis à jour avec succès', book });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
