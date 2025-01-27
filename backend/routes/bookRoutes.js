// Importation du module Express pour créer des routes
const express = require('express');
// Création d'un routeur Express
const router = express.Router();

// Importation des modules nécessaires
const fs = require('fs'); // Module pour gérer les fichiers
const path = require('path'); // Module pour manipuler les chemins de fichiers
const Book = require('../models/Book'); // Modèle Book pour interagir avec la base de données
const auth = require('../middleware/auth'); // Middleware pour gérer l'authentification
const multer = require('multer'); // Module pour gérer l'upload de fichiers

// Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
    // Définition du dossier de destination des fichiers uploadés
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Enregistre les fichiers dans le dossier 'uploads'
    },
    // Définition du nom des fichiers uploadés
    filename: (req, file, cb) => {
        const name = file.originalname.split(' ').join('_'); // Remplace les espaces par des underscores
        const extension = file.mimetype.split('/')[1]; // Extrait l'extension du fichier
        cb(null, name + Date.now() + '.' + extension); // Génère un nom unique
    }
});

// Initialisation de Multer avec la configuration de stockage
const upload = multer({ storage: storage });

// Route pour obtenir les livres les mieux notés
router.get('/bestrating', (req, res) => {
    Book.find() // Recherche tous les livres
        .sort({ averageRating: -1 }) // Trie par note moyenne décroissante
        .limit(5) // Limite les résultats aux 5 premiers livres
        .then(books => res.status(200).json(books)) // Envoie les livres trouvés en réponse
        .catch(error => res.status(400).json({ error })); // Envoie une erreur en cas d'échec
});

// Route pour obtenir tous les livres
router.get('/', (req, res) => {
    Book.find() // Recherche tous les livres
        .then(books => res.status(200).json(books)) // Envoie les livres trouvés en réponse
        .catch(error => res.status(400).json({ error })); // Envoie une erreur en cas d'échec
});

// Route pour obtenir un livre par son ID
router.get('/:id', (req, res) => {
    Book.findOne({ _id: req.params.id }) // Recherche un livre avec l'ID spécifié
        .then(book => res.status(200).json(book)) // Envoie le livre trouvé en réponse
        .catch(error => res.status(404).json({ error })); // Envoie une erreur si le livre n'existe pas
});

// Route pour ajouter un nouveau livre avec une image
router.post('/', auth, upload.single('image'), (req, res) => {
    const bookData = JSON.parse(req.body.book); // Parse les données du livre envoyées en JSON
    const book = new Book({
        ...bookData, // Copie les données du livre
        userId: req.auth.userId, // Ajoute l'ID de l'utilisateur connecté
        imageUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` // Génère l'URL de l'image
    });
    book.save() // Enregistre le livre dans la base de données
        .then(() => res.status(201).json({ message: 'Livre ajouté avec succès !' })) // Réponse en cas de succès
        .catch(error => res.status(400).json({ error })); // Réponse en cas d'erreur
});

// Route pour mettre à jour un livre
router.put('/:id', auth, upload.single('image'), (req, res) => {
    Book.findOne({ _id: req.params.id }) // Recherche un livre par ID
        .then(book => {
            // Vérifie si l'utilisateur connecté est le propriétaire du livre
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ error: 'Requête non autorisée !' }); // Réponse en cas d'autorisation refusée
            }

            // Supprime l'ancienne image si une nouvelle est fournie
            if (req.file && book.imageUrl) {
                const oldFilePath = path.join(__dirname, '../uploads', path.basename(book.imageUrl)); // Chemin de l'ancienne image
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath); // Supprime l'ancienne image
                }
            }

            // Prépare les nouvelles données du livre
            const bookData = req.file
                ? {
                      ...JSON.parse(req.body.book), // Ajoute les nouvelles données
                      imageUrl: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` // Ajoute l'URL de la nouvelle image
                  }
                : { ...req.body }; // Utilise les données envoyées si aucune image n'est uploadée

            Book.updateOne({ _id: req.params.id }, { ...bookData, _id: req.params.id }) // Met à jour le livre dans la base
                .then(() => res.status(200).json({ message: 'Livre modifié avec succès !' })) // Réponse en cas de succès
                .catch(error => res.status(400).json({ error })); // Réponse en cas d'erreur
        })
        .catch(error => res.status(404).json({ error })); // Réponse si le livre n'est pas trouvé
});

// Route pour supprimer un livre
router.delete('/:id', auth, (req, res) => {
    Book.findOne({ _id: req.params.id }) // Recherche un livre par ID
        .then(book => {
            // Vérifie si l'utilisateur connecté est le propriétaire du livre
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ error: 'Requête non autorisée !' }); // Réponse en cas d'autorisation refusée
            }

            // Supprime l'image associée au livre si elle existe
            if (book.imageUrl) {
                const filePath = path.join(__dirname, '../uploads', path.basename(book.imageUrl)); // Chemin de l'image
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath); // Supprime l'image
                }
            }

            Book.deleteOne({ _id: req.params.id }) // Supprime le livre de la base de données
                .then(() => res.status(200).json({ message: 'Livre supprimé avec succès !' })) // Réponse en cas de succès
                .catch(error => res.status(400).json({ error })); // Réponse en cas d'erreur
        })
        .catch(error => res.status(404).json({ error })); // Réponse si le livre n'est pas trouvé
});

// Route pour ajouter une note à un livre
router.post('/:id/rating', auth, (req, res) => {
    Book.findOne({ _id: req.params.id }) // Recherche un livre par ID
        .then(book => {
            // Vérifie si l'utilisateur a déjà noté le livre
            const existingRating = book.ratings.find(rating => rating.userId === req.auth.userId);
            if (existingRating) {
                return res.status(403).json({ error: 'Vous avez déjà noté ce livre.' }); // Réponse si déjà noté
            }

            // Ajoute la nouvelle note
            const newRating = { userId: req.auth.userId, grade: req.body.rating };
            book.ratings.push(newRating); // Ajoute la note au tableau des notes
            // Met à jour la note moyenne
            book.averageRating = parseFloat(
                (book.ratings.reduce((sum, r) => sum + r.grade, 0) / book.ratings.length).toFixed(1)
            );
            book.save() // Enregistre les modifications dans la base de données
                .then(() => res.status(200).json(book)) // Réponse en cas de succès
                .catch(error => res.status(400).json({ error })); // Réponse en cas d'erreur
        })
        .catch(error => res.status(404).json({ error })); // Réponse si le livre n'est pas trouvé
});

// Exportation du routeur
module.exports = router;
