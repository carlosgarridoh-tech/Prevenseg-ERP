import ExcelJS from 'exceljs';
import { supabase } from '../../config/supabase.js';

function formatearFechaLarga(fechaStr) {
  const fecha = new Date(fechaStr + 'T00:00:00');
  const texto = fecha.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// GET /api/horarios/curso/:cursoId/exportar -> descarga un .xlsx con el horario
export async function exportarExcel(req, res) {
  const { data: curso } = await supabase.from('cursos').select('nombre_curso').eq('id', req.params.cursoId).single();
  const { data: bloques, error } = await supabase
    .from('horario_bloques')
    .select('*, relatores(nombre)')
    .eq('curso_id', req.params.cursoId)
    .order('fecha')
    .order('hora_inicio');

  if (error) return res.status(500).json({ error: error.message });

  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet('Horario');

  const fechas = [...new Set(bloques.map((b) => b.fecha))].sort();
  const columnasFecha = fechas.map((f) => formatearFechaLarga(f));

  sheet.columns = [{ header: 'Hora', width: 14 }, ...columnasFecha.map((f) => ({ header: f, width: 26 }))];
  sheet.getRow(1).font = { bold: true };

  const horas = [...new Set(bloques.map((b) => b.hora_inicio))].sort();

  horas.forEach((hora) => {
    const fila = { Hora: hora.slice(0, 5) };
    fechas.forEach((fecha, i) => {
      const bloque = bloques.find((b) => b.fecha === fecha && b.hora_inicio === hora);
      fila[columnasFecha[i]] = bloque ? `${bloque.titulo}${bloque.relatores ? ' (' + bloque.relatores.nombre + ')' : ''}` : '';
    });
    const row = sheet.addRow(fila);

    fechas.forEach((fecha, i) => {
      const bloque = bloques.find((b) => b.fecha === fecha && b.hora_inicio === hora);
      if (bloque) {
        row.getCell(i + 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bloque.color.replace('#', '') } };
      }
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="horario-${curso?.nombre_curso || 'curso'}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}
