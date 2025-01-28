// Importation des modules nécessaires
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const multerWebP = require('../middleware/upload-optimizer-config');

// 📌 Route pour obtenir les livres les mieux notés
router.get('/bestrating', async (req, res) => {
    try {
        const books = await Book.find().sort({ averageRating: -1 }).limit(5);
        res.status(200).json(books);
    } catch (error) {
        res.status(400).json({ error });
    }
});

// 📌 Route pour obtenir tous les livres
router.get('/', async (req, res) => {
    try {
        const books = await Book.find();
        res.status(200).json(books);
    } catch (error) {
        res.status(400).json({ error });
    }
});

// 📌 Route pour obtenir un livre par son ID
router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id });
        if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
        res.status(200).json(book);
    } catch (error) {
        res.status(404).json({ error });
    }
});

// 📌 Route pour ajouter un nouveau livre avec une image WebP
router.post('/', auth, multerWebP, async (req, res) => {
    try {
        const bookData = JSON.parse(req.body.book);
        const book = new Book({
            ...bookData,
            userId: req.auth.userId,
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
        });
        await book.save();
        res.status(201).json({ message: 'Livre ajouté avec succès !' });
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de l'ajout du livre." });
    }
});

// 📌 Route pour mettre à jour un livre
router.put('/:id', auth, multerWebP, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id });
        if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
        if (book.userId !== req.auth.userId) return res.status(403).json({ error: 'Requête non autorisée !' });

        if (req.file && book.imageUrl) {
            const oldFilePath = path.join(__dirname, '../uploads', path.basename(book.imageUrl));
            if (fs.existsSync(oldFilePath)) fs.unlinkSync(oldFilePath);
        }

        const bookData = req.file ? {
            ...JSON.parse(req.body.book),
            imageUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
        } : { ...req.body };

        await Book.updateOne({ _id: req.params.id }, { ...bookData, _id: req.params.id });
        res.status(200).json({ message: 'Livre mis à jour avec succès !' });
    } catch (error) {
        res.status(400).json({ error });
    }
});

// 📌 Route pour supprimer un livre
router.delete('/:id', auth, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id });
        if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
        if (book.userId !== req.auth.userId) return res.status(403).json({ error: 'Requête non autorisée !' });

        if (book.imageUrl) {
            const filePath = path.join(__dirname, '../uploads', path.basename(book.imageUrl));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await Book.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Livre supprimé avec succès !' });
    } catch (error) {
        res.status(404).json({ error });
    }
});

// 📌 Route pour ajouter une note à un livre
router.post('/:id/rating', auth, async (req, res) => {
    try {
        const book = await Book.findOne({ _id: req.params.id });
        if (!book) return res.status(404).json({ error: 'Livre non trouvé' });

        const existingRating = book.ratings.find(rating => rating.userId === req.auth.userId);
        if (existingRating) return res.status(403).json({ error: 'Vous avez déjà noté ce livre.' });

        const newRating = { userId: req.auth.userId, grade: req.body.rating };
        book.ratings.push(newRating);
        book.averageRating = parseFloat(
            (book.ratings.reduce((sum, r) => sum + r.grade, 0) / book.ratings.length).toFixed(1)
        );

        await book.save();
        res.status(200).json(book);
    } catch (error) {
        res.status(400).json({ error });
    }
});

// Exportation du routeur
module.exports = router;
