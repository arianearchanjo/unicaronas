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

/**
 * Middleware para validar magic bytes dos arquivos após o upload pelo Multer
 */
const verificarMagicBytes = async (req, res, next) => {
  const files = [];
  
  if (req.file) files.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) {
      files.push(...req.files);
    } else {
      Object.values(req.files).forEach(fileArray => {
        files.push(...fileArray);
      });
    }
  }

  if (files.length === 0) return next();

  try {
    for (const file of files) {
      const buffer = Buffer.alloc(12);
      const fd = fs.openSync(file.path, 'r');
      fs.readSync(fd, buffer, 0, 12, 0);
      fs.closeSync(fd);

      const isJPG  = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
      const isPNG  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      const isPDF  = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
      const isWEBP = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                     buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

      let isValid = false;
      const mime = file.mimetype.toLowerCase();

      if (mime.includes('jpeg') || mime.includes('jpg')) isValid = isJPG;
      else if (mime.includes('png')) isValid = isPNG;
      else if (mime.includes('pdf')) isValid = isPDF;
      else if (mime.includes('webp')) isValid = isWEBP;

      if (!isValid) {
        // Deleta o arquivo malicioso/inválido
        fs.unlinkSync(file.path);
        return res.status(400).json({
          success: false,
          error: `Conteúdo do arquivo ${file.originalname} não corresponde ao tipo permitido.`
        });
      }
    }
    next();
  } catch (err) {
    console.error('Erro na validação de magic bytes:', err);
    return res.status(500).json({ success: false, error: 'Erro interno ao processar arquivos.' });
  }
};

module.exports = { upload, verificarMagicBytes };
