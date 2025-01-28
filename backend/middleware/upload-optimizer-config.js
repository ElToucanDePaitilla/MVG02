// Importation des modules nécessaires
const multer = require('multer');
const webp = require('webp-converter');
const fs = require('fs');
const path = require('path');

// 📌 Définition des types MIME autorisés et leurs extensions associées
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

// 📌 Configuration du stockage des fichiers avec Multer
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'uploads'); // 📂 Enregistre les fichiers dans le dossier 'uploads'
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_').split('.')[0];
        const extension = MIME_TYPES[file.mimetype];

        if (!extension) {
            return callback(new Error('❌ Type de fichier non supporté'), null);
        }

        callback(null, `${name}_${Date.now()}.${extension}`);
    }
});

// 📌 Middleware pour filtrer les fichiers selon leur type MIME
const fileFilter = (req, file, callback) => {
    if (MIME_TYPES[file.mimetype]) {
        callback(null, true);
    } else {
        callback(new Error('❌ Type de fichier non autorisé'), false);
    }
};

// 📌 Fonction pour convertir les images en WebP après upload
const convertToWebP = (filePath) => {
    return new Promise((resolve, reject) => {
        const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/, '.webp');
        console.log(`🔄 Conversion en WebP : ${filePath} -> ${webpPath}`);

        webp.cwebp(filePath, webpPath, "-q 80")
            .then((response) => {
                console.log(`✅ Image convertie en WebP : ${webpPath}`);

                // Supprime l'image originale après conversion
                fs.unlink(filePath, (err) => {
                    if (err) {
                        console.error("❌ Erreur lors de la suppression de l'image originale :", err);
                    }
                });
                resolve(webpPath);
            })
            .catch((error) => {
                console.error("❌ Erreur lors de la conversion en WebP :", error);
                reject(error);
            });
    });
};

// 📌 Middleware Multer avec conversion automatique en WebP
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 700 * 1024 } // 📏 0.7MB max
}).single('image');

// 📌 Middleware final pour gérer l'upload et la conversion en WebP
const multerWebP = (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ error: "❌ Aucun fichier envoyé." });
        }

        try {
            req.file.path = await convertToWebP(req.file.path);
            req.file.filename = path.basename(req.file.path);
            next();
        } catch (error) {
            return res.status(500).json({ error: "❌ Erreur de conversion WebP" });
        }
    });
};

// 📌 Exportation du middleware pour être utilisé dans les routes
module.exports = multerWebP;
