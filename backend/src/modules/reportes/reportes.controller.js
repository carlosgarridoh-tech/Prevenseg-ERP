import ExcelJS from 'exceljs';
import { supabase } from '../../config/supabase.js';
import { convertirAPdf } from '../documentos/generador.js';

async function obtenerDatos(tipo) {
  if (tipo === 'ingresos' || tipo === 'abonos') {
    const { data: pagos, error } = await supabase
      .from('pagos')
      .select('*, alumnos(nombres, apellido_paterno, cursos(nombre_curso))')
      .eq('anulado', false)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const columnas = ['Fecha', 'Alumno', 'Curso', 'Medio de pago', 'Monto'];
    const filas = pagos.map((p) => [
      new Date(p.created_at).toLocaleDateString('es-CL'),
      `${p.alumnos?.nombres || ''} ${p.alumnos?.apellido_paterno || ''}`.trim(),
      p.alumnos?.cursos?.nombre_curso || '',
      p.medio_pago,
      Number(p.monto)
    ]);
    const total = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

    const pagadoPorCurso = {};
    pagos.forEach((p) => {
      if (p.curso_id) pagadoPorCurso[p.curso_id] = (pagadoPorCurso[p.curso_id] || 0) + Number(p.monto);
    });
    const { data: cursos } = await supabase.from('cursos').select('id, nombre_curso, valor, alumnos(id)');
    const porCurso = (cursos || [])
      .map((c) => ({
        curso: c.nombre_curso,
        esperado: Number(c.valor) * (c.alumnos?.length || 0),
        pagado: pagadoPorCurso[c.id] || 0
      }))
      .filter((c) => c.esperado > 0 || c.pagado > 0);

    return { columnas, filas, total, porCurso };
  }

  if (tipo === 'deudas') {
    const { data: alumnos, error } = await supabase.from('alumnos').select('*, cursos(nombre_curso, valor), pagos(monto, anulado)');
    if (error) throw new Error(error.message);

    const columnas = ['Alumno', 'RUT', 'Curso', 'Valor curso', 'Pagado', 'Saldo pendiente'];
    const filas = [];
    let total = 0;

    alumnos.forEach((a) => {
      const valorCurso = a.cursos?.valor || 0;
      const pagado = (a.pagos || []).filter((p) => !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0);
      const saldo = valorCurso - pagado;
      if (saldo > 0) {
        filas.push([`${a.nombres} ${a.apellido_paterno}`, a.rut, a.cursos?.nombre_curso || '', valorCurso, pagado, saldo]);
        total += saldo;
      }
    });

    return { columnas, filas, total };
  }

  if (tipo === 'horas') {
    const { data, error } = await supabase.from('relatores').select('*, relator_curso(horas_asignadas, cursos(nombre_curso))');
    if (error) throw new Error(error.message);

    const columnas = ['Relator', 'Curso', 'Horas', 'Valor hora', 'Total a pagar'];
    const filas = [];
    let total = 0;

    data.forEach((r) => {
      (r.relator_curso || []).forEach((rc) => {
        const monto = Number(rc.horas_asignadas) * Number(r.valor_hora);
        filas.push([r.nombre, rc.cursos?.nombre_curso || '', Number(rc.horas_asignadas), Number(r.valor_hora), monto]);
        total += monto;
      });
    });

    return { columnas, filas, total };
  }

  if (tipo === 'pagos-relatores') {
    const { data: pagos, error } = await supabase
      .from('pagos_relatores')
      .select('*, relatores(nombre), cursos(nombre_curso)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const columnas = ['Fecha', 'Relator', 'Curso', 'Medio de pago', 'Monto'];
    const filas = pagos.map((p) => [
      new Date(p.created_at).toLocaleDateString('es-CL'),
      p.relatores?.nombre || '',
      p.cursos?.nombre_curso || '',
      p.medio_pago || '',
      Number(p.monto)
    ]);
    const total = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

    return { columnas, filas, total };
  }

  if (tipo === 'consolidado') {
    const { data: pagos, error } = await supabase
      .from('pagos')
      .select('*, alumnos(nombres, apellido_paterno, rut, nombre_empresa, tipo_empresa, cursos(nombre_curso, tipo_curso))')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const columnas = ['Fecha', 'Alumno', 'RUT', 'Empresa', 'Tipo empresa', 'Curso', 'Tipo curso', 'Medio de pago', 'N° boleta SII', 'Monto', 'Estado'];
    const filas = pagos.map((p) => [
      new Date(p.created_at).toLocaleDateString('es-CL'),
      `${p.alumnos?.nombres || ''} ${p.alumnos?.apellido_paterno || ''}`.trim(),
      p.alumnos?.rut || '',
      p.alumnos?.nombre_empresa || '',
      p.alumnos?.tipo_empresa || '',
      p.alumnos?.cursos?.nombre_curso || '',
      p.alumnos?.cursos?.tipo_curso || '',
      p.medio_pago,
      p.boleta_sii || '',
      Number(p.monto),
      p.anulado ? 'Anulado' : 'Vigente'
    ]);
    const total = pagos.filter((p) => !p.anulado).reduce((acc, p) => acc + Number(p.monto), 0);

    return { columnas, filas, total };
  }

  throw new Error('Tipo de reporte no reconocido');
}

// Formatea el detalle de un pago igual que en la planilla del cliente:
// "Medio: X\nFecha: Y\nNro. transacción: Z\nNro. Bol: W"
function formatearDetallePago(pago) {
  const fecha = new Date(pago.created_at);
  const fechaTexto = fecha.toLocaleString('sv-SE').replace('T', ' '); // formato YYYY-MM-DD HH:mm:ss
  return [
    `Medio: ${pago.medio_pago}`,
    `Fecha: ${fechaTexto}`,
    `Nro. transacción: ${pago.numero_operacion || 'No aplica'}`,
    `Nro. Bol: ${pago.boleta_sii || 'No aplica'}`
  ].join('\n');
}

// GET /api/reportes/pago-completo/exportar?formato=excel|pdf
// Genera un libro con UNA HOJA POR CURSO, replicando el formato de control de pagos del cliente
export async function exportarPagoCompleto(req, res) {
  try {
    const { data: cursos, error } = await supabase
      .from('cursos')
      .select('id, nombre_curso, valor, alumnos(id, rut, nombres, apellido_paterno, apellido_materno, nombre_empresa, pagos(monto, anulado, medio_pago, numero_operacion, boleta_sii, created_at))');
    if (error) throw new Error(error.message);

    const wb = new ExcelJS.Workbook();
    const estiloTitulo = { font: { bold: true, size: 13 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3D9D9' } } };
    const estiloGrupo = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } }, alignment: { horizontal: 'center' } };
    const estiloHeader = { font: { bold: true }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } } };

    cursos.forEach((curso) => {
      const alumnos = (curso.alumnos || []).map((a) => ({
        ...a,
        pagosVigentes: (a.pagos || []).filter((p) => !p.anulado).sort((x, y) => new Date(x.created_at) - new Date(y.created_at))
      }));
      if (!alumnos.length) return;

      const maxCuotas = Math.max(1, ...alumnos.map((a) => a.pagosVigentes.length));
      const nombreHoja = `Pagos ${curso.nombre_curso}`.slice(0, 31).replace(/[\\/*?:[\]]/g, '');
      const sheet = wb.addWorksheet(nombreHoja);

      const totalColumnas = 4 + maxCuotas * 2 + 3;

      // Fila 1: título
      sheet.mergeCells(1, 1, 1, totalColumnas);
      sheet.getCell(1, 1).value = `CONTROL DE PAGOS - ${curso.nombre_curso.toUpperCase()}`;
      Object.assign(sheet.getCell(1, 1), estiloTitulo);

      // Fila 2: grupos
      sheet.mergeCells(2, 1, 2, 4);
      sheet.getCell(2, 1).value = 'Datos del alumno';
      for (let i = 0; i < maxCuotas; i++) {
        sheet.mergeCells(2, 5 + i * 2, 2, 6 + i * 2);
        sheet.getCell(2, 5 + i * 2).value = `Cuota ${i + 1}`;
      }
      sheet.mergeCells(2, 5 + maxCuotas * 2, 2, totalColumnas);
      sheet.getCell(2, 5 + maxCuotas * 2).value = 'Resumen';
      sheet.getRow(2).eachCell((cell) => Object.assign(cell, estiloGrupo));

      // Fila 3: encabezados reales
      const encabezados = ['Nº', 'RUT', 'Nombre completo', 'Empresa'];
      for (let i = 0; i < maxCuotas; i++) encabezados.push(`Monto cuota ${i + 1}`, `Detalle pago cuota ${i + 1}`);
      encabezados.push('Total pagado', 'Saldo pendiente', 'Total a pagar');
      sheet.addRow(encabezados);
      sheet.getRow(3).eachCell((cell) => Object.assign(cell, estiloHeader));

      // Filas de datos
      alumnos.forEach((a, index) => {
        const totalPagado = a.pagosVigentes.reduce((acc, p) => acc + Number(p.monto), 0);
        const fila = [
          index + 1,
          a.rut,
          `${a.nombres} ${a.apellido_paterno} ${a.apellido_materno || ''}`.trim(),
          a.nombre_empresa || ''
        ];
        for (let i = 0; i < maxCuotas; i++) {
          const pago = a.pagosVigentes[i];
          fila.push(pago ? Number(pago.monto) : '', pago ? formatearDetallePago(pago) : '');
        }
        fila.push(totalPagado, Number(curso.valor) - totalPagado, Number(curso.valor));
        sheet.addRow(fila);
      });

      sheet.columns.forEach((col, i) => (col.width = i < 4 ? 20 : i >= 4 + maxCuotas * 2 ? 16 : 24));
      sheet.eachRow((row) => row.eachCell((cell) => (cell.alignment = { ...cell.alignment, wrapText: true, vertical: 'top' })));
    });

    const formato = req.query.formato === 'pdf' ? 'pdf' : 'excel';
    const bufferXlsx = await wb.xlsx.writeBuffer();

    if (formato === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-pago-completo.xlsx"');
      return res.end(bufferXlsx);
    }

    try {
      const bufferPdf = await convertirAPdf(bufferXlsx, 'xlsx');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-pago-completo.pdf"');
      return res.end(bufferPdf);
    } catch (e) {
      console.error('No se pudo convertir a PDF:', e.message);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="reporte-pago-completo.xlsx"');
      res.setHeader('X-Pdf-Fallo', '1');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Pdf-Fallo');
      return res.end(bufferXlsx);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

export async function ver(req, res) {
  try {
    const datos = await obtenerDatos(req.params.tipo);
    res.json(datos);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

export async function exportar(req, res) {
  try {
    const { columnas, filas } = await obtenerDatos(req.params.tipo);
    const formato = req.query.formato === 'pdf' ? 'pdf' : 'excel';

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Reporte');
    sheet.addRow(columnas).font = { bold: true };
    filas.forEach((f) => sheet.addRow(f));
    sheet.columns.forEach((col) => (col.width = 22));

    const bufferXlsx = await wb.xlsx.writeBuffer();
    const nombreBase = `reporte-${req.params.tipo}`;

    if (formato === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreBase}.xlsx"`);
      return res.end(bufferXlsx);
    }

    try {
      const bufferPdf = await convertirAPdf(bufferXlsx, 'xlsx');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreBase}.pdf"`);
      return res.end(bufferPdf);
    } catch (e) {
      console.error('No se pudo convertir el reporte a PDF:', e.message);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreBase}.xlsx"`);
      res.setHeader('X-Pdf-Fallo', '1');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, X-Pdf-Fallo');
      return res.end(bufferXlsx);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
