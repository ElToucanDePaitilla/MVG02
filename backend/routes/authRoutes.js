// Importation du module Express pour créer des routes
const express = require('express');
// Création d'un routeur Express
const router = express.Router();

// Importation des modules nécessaires
const bcrypt = require('bcrypt'); // Module pour le hachage des mots de passe
const jwt = require('jsonwebtoken'); // Module pour la génération et la vérification des tokens JWT
const User = require('../models/User'); // Modèle User pour interagir avec la base de données

// Middleware d'authentification
// Vérifie si le token JWT est valide pour les routes protégées
const auth = (req, res, next) => {
    try {
        // Extraction du token depuis les en-têtes de la requête
        const token = req.headers.authorization.split(' ')[1];
        // Décodage et vérification du token
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET');
        req.userId = decodedToken.userId; // Ajout de l'ID de l'utilisateur à l'objet req
        next(); // Passe au middleware suivant
    } catch (error) {
        // Réponse en cas d'erreur d'authentification
        res.status(401).json({ message: 'Requête non authentifiée !' });
    }
};

// Route pour l'inscription d'un utilisateur
router.post('/signup', (req, res) => {
    // Vérification des données obligatoires
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Email et mot de passe sont requis !' });
    }

    // Hachage du mot de passe avec bcrypt
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            // Création d'un nouvel utilisateur avec l'email et le mot de passe haché
            const user = new User({ email: req.body.email, password: hash });
            user.save() // Enregistrement de l'utilisateur dans la base de données
                .then(() => res.status(201).json({ message: 'Utilisateur créé avec succès !' })) // Réponse en cas de succès
                .catch(error => res.status(400).json({ error: 'Erreur lors de la création de l’utilisateur : ' + error.message })); // Réponse en cas d'erreur
        })
        .catch(error => res.status(500).json({ error: 'Erreur interne : ' + error.message })); // Réponse en cas d'erreur interne
});

// Route pour la connexion d'un utilisateur
router.post('/login', (req, res) => {
    // Vérification des données obligatoires
    if (!req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Email et mot de passe sont requis !' });
    }

    // Recherche de l'utilisateur dans la base de données par email
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'Utilisateur non trouvé !' }); // Réponse si l'utilisateur n'existe pas
            }
            // Comparaison du mot de passe envoyé avec le mot de passe haché enregistré
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ message: 'Mot de passe incorrect !' }); // Réponse si le mot de passe est invalide
                    }
                    // Génération d'un token JWT en cas de mot de passe valide
                    const token = jwt.sign(
                        { userId: user._id }, // Données à inclure dans le token
                        process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET', // Clé secrète pour signer le token
                        { expiresIn: '24h' } // Durée de validité du token
                    );
                    // Réponse avec l'ID de l'utilisateur et le token généré
                    res.status(200).json({ userId: user._id, token });
                })
                .catch(error => res.status(500).json({ error: 'Erreur interne : ' + error.message })); // Réponse en cas d'erreur interne
        })
        .catch(error => res.status(500).json({ error: 'Erreur interne : ' + error.message })); // Réponse en cas d'erreur interne
});

/*
// Exemple de route protégée pour tester l'authentification
router.get('/profile', auth, (req, res) => {
    // Réponse uniquement accessible si l'utilisateur est authentifié
    res.status(200).json({ message: 'Accès autorisé à cette route sécurisée', userId: req.userId });
});
*/

// Exportation du routeur pour utilisation dans d'autres fichiers
module.exports = router;
