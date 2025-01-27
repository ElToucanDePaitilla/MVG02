const express = require('express'); 
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Importer CORS

dotenv.config();

const authRoutes = require('./routes/authRoutes.js');
const bookRoutes = require('./routes/bookRoutes');

const app = express();

// Middleware pour gérer les requêtes JSON
app.use(express.json());

// Middleware pour gérer CORS
app.use(cors({
    origin: 'http://localhost:3000', // URL du frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Méthodes autorisées
    credentials: true // Si vous utilisez des cookies ou des sessions
}));

// Middleware pour servir les fichiers statiques dans le dossier uploads
app.use('/uploads', express.static('uploads'));

// Connexion à MongoDB (sans useNewUrlParser ni useUnifiedTopology)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connexion à MongoDB réussie !'))
    .catch(error => console.error('❌ Erreur de connexion à MongoDB :', error));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// Lancement du serveur
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

