const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Garante que os diretórios de uploads existem
const DIRS = {
  profiles: path.join(__dirname, '../../uploads/profiles'),
  documentos: path.join(__dirname, '../../uploads/documentos')
};

Object.values(DIRS).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define a pasta de destino baseada no campo do formulário
    if (file.fieldname === 'foto') {
      cb(null, DIRS.profiles);
    } else if (file.fieldname === 'cnh' || file.fieldname === 'identidade') {
      cb(null, DIRS.documentos);
    } else {
      cb(null, DIRS.profiles);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    
    // Se tiver usuário logado, usa o ID. Se não (cadastro), usa apenas o sufixo.
    const prefix = req.usuario ? `user-${req.usuario.id}` : 'new';
    cb(null, `${file.fieldname}-${prefix}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);

  if (ext && mime) {
    return cb(null, true);
  }
  cb(new Error('Formato de arquivo não permitido. Use JPEG, PNG, WEBP ou PDF.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB para documentos
});

module.exports = upload;
