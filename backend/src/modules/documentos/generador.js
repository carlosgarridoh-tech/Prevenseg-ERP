import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ExcelJS from 'exceljs';
import libre from 'libreoffice-convert';
import { promisify } from 'util';

const convertirAsync = promisify(libre.convert);

// Rellena una plantilla Word (.docx) reemplazando {nombre}, {rut}, {fecha_inicio}, etc.
export function llenarDocx(rutaPlantilla, datos) {
  const contenido = fs.readFileSync(rutaPlantilla, 'binary');
  const zip = new PizZip(contenido);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
    nullGetter: () => '' // si un marcador no coincide con ningún dato, deja el espacio vacío en vez de "undefined"
  });
  doc.render(datos);
  return doc.getZip().generate({ type: 'nodebuffer' });
}

// Rellena una plantilla Excel (.xlsx): busca y reemplaza {nombre}, {rut}, etc. en todas las celdas de texto
export async function llenarXlsx(rutaPlantilla, datos) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(rutaPlantilla);

  wb.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        if (typeof cell.value === 'string') {
          let valor = cell.value;
          Object.entries(datos).forEach(([clave, val]) => {
            valor = valor.replaceAll(`{${clave}}`, val ?? '');
          });
          cell.value = valor;
        }
      });
    });
  });

  return wb.xlsx.writeBuffer();
}

// Convierte un buffer (docx o xlsx) a PDF usando LibreOffice instalado en el servidor
export async function convertirAPdf(buffer, extensionOrigen) {
  return convertirAsync(buffer, '.pdf', undefined);
}

export function datosAlumnoParaPlantilla(alumno) {
  return {
    nombre: `${alumno.nombres} ${alumno.apellido_paterno} ${alumno.apellido_materno || ''}`.trim(),
    rut: alumno.rut,
    correo: alumno.correo || '',
    nombre_curso: alumno.cursos?.nombre_curso || '',
    fecha_inicio: alumno.cursos?.fecha_inicio || '',
    fecha_termino: alumno.cursos?.fecha_termino || ''
  };
}
