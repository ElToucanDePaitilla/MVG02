const fs = require('fs');
const path = require('path');
const Book = require('../models/Book'); // Modèle des livres

// 📌 Supprimer un livre et son fichier image associé
exports.deleteBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        // Supprimer l'image associée au livre dans le dossier uploads
        const filePath = path.join(__dirname, '../uploads', book.image);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Supprimer le livre de la base de données
        await Book.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Livre supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// 📌 Mettre à jour un livre avec une nouvelle image
exports.updateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        // Vérification du format et de la taille du fichier
        if (req.file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(req.file.mimetype) || req.file.size > 700 * 1024) {
                return res.status(400).json({
                    error: 'Votre fichier doit être au format jpg ou jpeg ou png et ne pas dépasser 700 Ko.',
                });
            }
        }

        // Supprimer l'ancienne image si elle existe
        if (req.file && book.image) {
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

// 📌 Ajouter un nouveau livre avec une image WebP
exports.addBook = async (req, res) => {
    try {
        const bookData = JSON.parse(req.body.book);

        if (req.file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(req.file.mimetype) || req.file.size > 700 * 1024) {
                return res.status(400).json({
                    error: 'Votre fichier doit être au format jpg ou jpeg ou png et ne pas dépasser 700 Ko.',
                });
            }
        }

        const book = new Book({
            ...bookData,
            userId: req.auth.userId,
            image: req.file ? req.file.filename : '',
        });

        await book.save();
        res.status(201).json({ message: 'Livre ajouté avec succès !', book });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ajout du livre.', error });
    }
};

// 📌 Obtenir un livre par son ID
exports.getBookById = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// 📌 Obtenir tous les livres
exports.getAllBooks = async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// 📌 Obtenir les livres les mieux notés
exports.getBestRatedBooks = async (req, res) => {
    try {
        const books = await Book.find().sort({ averageRating: -1 }).limit(5);
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// 📌 Ajouter une note à un livre
exports.rateBook = async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        if (!book) {
            return res.status(404).json({ message: 'Livre non trouvé' });
        }

        // Vérifier si l'utilisateur a déjà noté le livre
        const existingRating = book.ratings.find((rating) => rating.userId === req.auth.userId);
        if (existingRating) {
            return res.status(403).json({ message: 'Vous avez déjà noté ce livre.' });
        }

        // Ajouter la nouvelle note
        const newRating = { userId: req.auth.userId, grade: req.body.rating };
        book.ratings.push(newRating);
        book.averageRating = parseFloat(
            (book.ratings.reduce((sum, r) => sum + r.grade, 0) / book.ratings.length).toFixed(1)
        );

        await book.save();
        res.status(200).json(book);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
