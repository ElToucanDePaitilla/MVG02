// Importation du module "express", une bibliothèque Node.js pour créer des serveurs web facilement
const express = require('express');

// Création d'une application Express, qui est une instance du serveur
const app = express();

// Middleware 01 : Fonction exécutée pour chaque requête reçue par le serveur
// Les middlewares sont des fonctions qui interviennent entre la réception de la requête et l'envoi de la réponse
app.use((req, res, next) => {
    // Affiche un message dans la console pour indiquer que ce middleware a été exécuté
    console.log('Requête Middleware 01 reçue, message pour la console ! 👍');
    // Appelle "next()" pour passer la main au middleware suivant
    next();
});

// Middleware 02 : Définit le statut de la réponse HTTP à 201
// Le statut "201" indique que la ressource a été créée (utile dans certaines API REST)
app.use((req, res, next) => {
    // Définit le code de statut de la réponse HTTP
    res.status('201'); 
    // Passe la main au middleware suivant
    next();
});

// Middleware 03 : Envoie une réponse JSON au client
// Le format JSON est souvent utilisé pour communiquer avec des applications front-end ou d'autres services
app.use((req, res, next) => {
    // Envoie un objet JSON comme réponse avec un message
    res.json({message: 'Requête Middleware 01 reçue, message pour le client  ! 🎉'});
});

// Exportation de l'application Express pour qu'elle puisse être utilisée dans d'autres fichiers
module.exports = app;
