const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // Récupération du token JWT depuis les en-têtes de la requête
        const token = req.headers.authorization.split(' ')[1]; // Supposé être sous la forme "Bearer <token>"

        // Vérification et décodage du token
        const decodedToken = jwt.verify(
            token, // Token à vérifier
            process.env.JWT_SECRET || 'RANDOM_TOKEN_SECRET' // Clé secrète pour la vérification
        );

        // Ajout des informations décodées à l'objet de requête
        req.auth = { userId: decodedToken.userId }; // Stocke l'ID utilisateur pour une utilisation ultérieure

        // Passe au middleware ou à la route suivante
        next();
    } catch {
        // Réponse en cas d'échec d'authentification (token invalide ou absent)
        res.status(403).json({ error: new Error('Requête non authentifiée !') });
    }
};


