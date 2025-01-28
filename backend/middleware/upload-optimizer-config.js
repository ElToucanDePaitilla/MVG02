const multer = require('multer');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        console.log("📂 Destination définie: uploads");
        callback(null, 'uploads');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_').split('.')[0];
        const extension = MIME_TYPES[file.mimetype];

        if (!extension) {
            console.log("❌ Type de fichier non supporté: ", file.mimetype);
            return callback(new Error('❌ Type de fichier non supporté'), null);
        }

        const filename = `${name}_${Date.now()}.${extension}`;
        console.log("✅ Nom de fichier généré: ", filename);
        callback(null, filename);
    },
});

const fileFilter = (req, file, callback) => {
    if (!MIME_TYPES[file.mimetype]) {
        console.log("❌ Fichier rejeté: format incorrect -", file.mimetype);
        return callback(new Error('Votre fichier doit être au format jpg, jpeg ou png et ne pas dépasser 700 Ko.'), false);
    }
    console.log("✅ Fichier accepté: ", file.mimetype);
    callback(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 700 * 1024 }, // Limite de 700 Ko
}).single('image');

const multerMiddleware = (req, res, next) => {
    console.log("📢 Début du téléchargement de l'image...");
    upload(req, res, (err) => {
        if (err) {
            let errorMessage = 'Une erreur s\'est produite lors du téléchargement de l\'image.';
            
            if (err.code === 'LIMIT_FILE_SIZE') {
                errorMessage = 'Votre fichier doit être au format jpg, jpeg ou png et ne pas dépasser 700 Ko.';
                console.log("⚠️ Erreur: Taille du fichier dépassée -", req.file ? req.file.originalname : "Aucun fichier reçu");
            } else if (err.message) {
                errorMessage = err.message;
                console.log("❌ Erreur de téléchargement:", err.message);
            }
            
            console.log("🚨 Erreur envoyée au FE: ", errorMessage);
            return res.status(400).json({ error: errorMessage });
        }
        console.log("✅ Téléchargement réussi: ", req.file ? req.file.filename : "Aucun fichier reçu");
        next();
    });
};

module.exports = multerMiddleware;
