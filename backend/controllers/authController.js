// Importation des modules nécessaires
const bcrypt = require('bcrypt'); // Pour hacher les mots de passe
const jwt = require('jsonwebtoken'); // Pour gérer les tokens JWT
const User = require('../models/User'); // Modèle User pour interagir avec MongoDB
const dotenv = require('dotenv'); // Pour gérer les variables d'environnement

dotenv.config(); // Chargement des variables d'environnement

// 📌 **Contrôleur pour l'inscription (signup)**
exports.signup = async (req, res) => {
    try {
        console.log("📢 Requête d'inscription reçue :", req.body.email);

        // Vérifier que l'email et le mot de passe sont fournis
        if (!req.body.email || !req.body.password) {
            console.log("⚠️ Champs requis manquants !");
            return res.status(400).json({ message: "Email et mot de passe sont requis." });
        }

        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            console.log("⚠️ Email déjà utilisé !");
            return res.status(400).json({ message: "Cet email est déjà utilisé. Veuillez en choisir un autre." });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        
        // Création d'un nouvel utilisateur
        const user = new User({
            email: req.body.email,
            password: hashedPassword
        });

        // Sauvegarde en base de données
        await user.save();
        console.log("✅ Utilisateur créé avec succès !");
        res.status(201).json({ message: "Compte créé avec succès !" });
    } catch (error) {
        console.error("❌ Erreur lors de l'inscription :", error);
        res.status(500).json({ message: "Erreur interne du serveur lors de l'inscription.", error });
    }
};

// 📌 **Contrôleur pour la connexion (login)**
exports.login = async (req, res) => {
    try {
        console.log("📢 Tentative de connexion avec :", req.body.email);

        // Vérifier si l'utilisateur existe
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            console.log("⚠️ Email non enregistré !");
            return res.status(401).json({ message: "Cet email n'est pas enregistré. Veuillez vous inscrire." });
        }

        // Vérifier si le mot de passe est correct
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            console.log("⚠️ Mot de passe incorrect !");
            return res.status(401).json({ message: "Mot de passe incorrect. Veuillez réessayer." });
        }

        // Générer un token JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET, // Clé secrète depuis les variables d'environnement
            { expiresIn: '24h' }
        );

        console.log("✅ Connexion réussie !");
        res.status(200).json({
            userId: user._id,
            token: token
        });
    } catch (error) {
        console.error("❌ Erreur lors de la connexion :", error);
        res.status(500).json({ message: "Erreur interne du serveur lors de l'authentification.", error });
    }
};

