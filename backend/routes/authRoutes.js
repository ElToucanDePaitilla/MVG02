// Importation du module Express pour créer des routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log("✅ authRoutes.js chargé avec succès"); // Vérification que le fichier est bien importé

// Middleware d'authentification
const auth = (req, res, next) => {
    try {
        console.log("🔑 Vérification du token JWT...");
        const token = req.headers.authorization?.split(' ')[1]; // Vérifier si l'en-tête existe
        if (!token) {
            console.log("⚠️ Aucun token fourni !");
            return res.status(401).json({ message: "Requête non authentifiée !" });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET');
        req.userId = decodedToken.userId;
        console.log("✅ Authentification réussie pour l'utilisateur :", req.userId);
        next();
    } catch (error) {
        console.error("❌ Erreur d'authentification :", error);
        res.status(401).json({ message: "Requête non authentifiée !" });
    }
};

// Route pour l'inscription
router.post('/signup', (req, res, next) => {
    console.log("📢 Requête reçue sur /api/auth/signup :", req.body); // Vérifie si cette ligne apparaît
    next();
}, authController.signup);

// Route pour la connexion
router.post('/login', (req, res, next) => {
    console.log("📢 Requête reçue sur /api/auth/login :", req.body); // Vérifie si cette ligne apparaît
    next();
}, authController.login);

// Exemple de route protégée pour tester l'authentification
router.get('/profile', auth, (req, res) => {
    console.log("📢 Accès à la route protégée /api/auth/profile");
    res.status(200).json({ message: 'Accès autorisé à cette route sécurisée', userId: req.userId });
});

// Exportation du routeur pour utilisation dans d'autres fichiers
module.exports = router;

