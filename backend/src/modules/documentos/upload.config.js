import multer from 'multer';
import path from 'path';
import fs from 'fs';

const carpeta = path.resolve('uploads/plantillas');
if (!fs.existsSync(carpeta)) fs.mkdirSync(carpeta, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpeta),
  filename: (req, file, cb) => {
    const nombre = `${req.body.tipo}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, nombre);
  }
});

export const uploadPlantilla = multer({ storage });
export const carpetaPlantillas = carpeta;

const carpetaRecursos = path.resolve('uploads/recursos');
if (!fs.existsSync(carpetaRecursos)) fs.mkdirSync(carpetaRecursos, { recursive: true });

const storageRecursos = multer.diskStorage({
  destination: (req, file, cb) => cb(null, carpetaRecursos),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

export const uploadRecurso = multer({ storage: storageRecursos });
