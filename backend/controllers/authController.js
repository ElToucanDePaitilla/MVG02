// Importation des modules nécessaires
const bcrypt = require('bcrypt'); // Pour hacher les mots de passe
const jwt = require('jsonwebtoken'); // Pour gérer les tokens JWT
const User = require('../models/User'); // Modèle User pour interagir avec MongoDB
const dotenv = require('dotenv'); // Pour gérer les variables d'environnement

dotenv.config(); // Chargement des variables d'environnement

// 📌 **Contrôleur pour l'inscription (signup)**
exports.signup = async (req, res) => {
    try {
        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé. Veuillez en choisir un autre." });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        // Création d'un nouvel utilisateur
        const user = new User({
            email: req.body.email,
            password: hashedPassword
        });

        // Sauvegarde de l'utilisateur en base de données
        await user.save();
        res.status(201).json({ message: "Compte créé avec succès !" });
    } catch (error) {
        res.status(500).json({ message: "Erreur interne du serveur lors de l'inscription.", error });
    }
};

// 📌 **Contrôleur pour la connexion (login)**
exports.login = async (req, res) => {
    try {
        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(401).json({ message: "Cet email n'est pas enregistré. Veuillez vous inscrire." });
        }

        // Vérifier si le mot de passe est correct
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Mot de passe incorrect. Veuillez réessayer." });
        }

        // Générer un token JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET, // Clé secrète depuis les variables d'environnement
            { expiresIn: '24h' }
        );

        res.status(200).json({
            userId: user._id,
            token: token
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur interne du serveur lors de l'authentification.", error });
    }
};
