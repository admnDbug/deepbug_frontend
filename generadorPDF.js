// --- generadorPdf.js ---
// Motor dedicado exclusivamente a la compilación y descarga de reportes PDF.

document.addEventListener('DOMContentLoaded', () => {
    const btnPDF = document.getElementById('btn-descargar-pdf');
    if (!btnPDF) return;

    const token = localStorage.getItem('token');
    const urlParams = new URLSearchParams(window.location.search);
    const proyectoId = urlParams.get('id');

    btnPDF.addEventListener('click', async () => {
        try {
            btnPDF.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Compilando reporte científico...';
            btnPDF.disabled = true;

            // 1. Info Básica de la Pantalla
            const nombreProyecto = document.getElementById('vp-nombre-proyecto').textContent;
            const nombreZona = document.getElementById('vp-zona-proyecto').textContent;
            const fechaCreacion = document.getElementById('vp-fecha-creacion').textContent;
            const responsable = document.getElementById('vp-responsable-nombre').textContent;

            const listaColabs = [];
            document.querySelectorAll('#contenedor-colaboradores .fw-bold').forEach(el => listaColabs.push(el.textContent));
            const colaboradoresTexto = listaColabs.length > 0 ? listaColabs.join(', ') : 'Sin colaboradores asignados';

            // 2. Extraer Protocolos de BD
            const resProtocolos = await fetch(`http://localhost:3000/api/protocolos/${proyectoId}`, { headers: { 'Authorization': `Bearer ${token}` }});
            const protocolos = await resProtocolos.json();

            const p1 = protocolos.find(p => p.protocolo_numero === 1 && p.estado === 'aprobado');
            const p2 = protocolos.find(p => p.protocolo_numero === 2 && p.estado === 'aprobado');
            const p3 = protocolos.find(p => p.protocolo_numero === 3 && p.estado === 'aprobado');
            const p4 = protocolos.find(p => p.protocolo_numero === 4 && p.estado === 'aprobado');
            const p5 = protocolos.find(p => p.protocolo_numero === 5 && p.estado === 'aprobado');

            // --- EXTRACCIÓN DE DATOS P1 ---
            const d1 = p1 ? p1.datos_formulario : {};
            const d1_gen = d1.datos_generales || {};
            const d1_est = d1.identificacion?.estaciones || [];
            const d1_par = d1.parametros_in_situ || {};
            const d1_res = d1.responsables || {};
            const d1_mat = d1.verificacion_materiales || {};
            const listParametrosInSitu = ['Conductividad', 'pH', 'Temperatura', 'Oxígeno disuelto', 'Salinidad', 'Turbiedad'];
            const listEquipos = ['Flujómetro', 'Termómetro', 'Conductivímetro', 'Multiparámetros', 'GPS', 'Cámara fotográfica'];
            const listInsumos = ['Red tipo D', 'Envases plásticos', 'Caja de Herramienta', 'R. Triangular', 'Frascos fisicoq.', 'Tijeras', 'Celular', 'Cinta métrica', 'Bolsas herméticas', 'Lápices', 'C. fluorescentes', 'Tabla anot.', 'Lupas', 'Viales de plásticos', 'Alcohol', 'Tamices', 'Pilotos indelebles', 'C. adhesiva', 'Etiquetas', 'Pinzas entomol.', 'Guantes', 'Bandejas blancas', 'Mascarillas', 'Botellas de lavado'];

            // --- EXTRACCIÓN DE DATOS P2 ---
            const d2_form = p2 ? p2.datos_formulario : {};
            const d2 = d2_form.textos || {};
            const getActives = (obj) => obj ? Object.keys(obj).filter(k => obj[k]).join(', ') || '--' : '--';

            // Checkboxes P2
            const clima = getActives(d2_form.clima);
            const bosques = getActives(d2_form.bosques);
            const sucesional = getActives(d2_form.sucesional);
            const cult_perm = getActives(d2_form.cult_perm);
            const cult_anuales = getActives(d2_form.cult_anuales);
            const veg_arbustiva = getActives(d2_form.veg_arbustiva);
            const otros_usos = getActives(d2_form.otros_usos);
            const descargas = getActives(d2_form.descargas);
            const tipo_efluente = getActives(d2_form.tipo_efluente);
            const veg_acuatica = getActives(d2_form.veg_acuatica);
            const olor = getActives(d2_form.olor);
            const color = getActives(d2_form.color);

            // HTML de la Fotografía del P2
            const imgP2Html = d2_form.foto_url
                ? `<div style="text-align: center; margin: 15px 0;">
                     <img src="${d2_form.foto_url}" style="max-height: 250px; border-radius: 8px; border: 1px solid #dee2e6; object-fit: contain;">
                     <div style="font-size: 11px; color: #666; margin-top: 5px;">Código de Fotografía: <b>${d2.codigo_foto || 'Sin código'}</b></div>
                   </div>`
                : `<div style="text-align: center; margin: 15px 0; padding: 30px; background-color: #f8f9fa; border: 1px dashed #ced4da; border-radius: 8px; font-size: 12px; color: #6c757d;">
                     <i class="fas fa-camera" style="font-size: 20px; display: block; margin-bottom: 5px;"></i> Sin fotografía registrada en el sitio
                   </div>`;

            // --- EXTRACCIÓN DE DATOS P3 ---
            const d3 = p3 ? p3.datos_formulario : {};
            const gradienteActivo = d3.tipo_gradiente || 'Alto';
            const puntajesAlto = d3.puntajes_alto || {};
            const puntajesBajo = d3.puntajes_bajo || {};
            const scoreAltoTotal = d3.puntaje_total_alto || 0;
            const scoreBajoTotal = d3.puntaje_total_bajo || 0;

            const nombresParametrosP3 = {
                1: { alto: "1. Heterogeneidad y estabilidad del sustrato", bajo: "1. Heterogeneidad y estabilidad del sustrato" },
                2: { alto: "2. Empotramiento del sustrato", bajo: "2. Caracterización del sustrato de pozas" },
                3: { alto: "3. Relación profundidad y velocidad", bajo: "3. Variabilidad de las pozas" },
                4: { alto: "4. Deposición de sedimentos", bajo: "4. Deposición de sedimentos" },
                5: { alto: "5. Estado del flujo del cauce", bajo: "5. Estado del flujo del cauce" },
                6: { alto: "6. Alteración del cauce", bajo: "6. Alteración del cauce" },
                7: { alto: "7. Frecuencia de rápidos", bajo: "7. Sinuosidad del canal" },
                8: { alto: "8. Estabilidad de la ribera (Márgenes)", bajo: "8. Estabilidad de la ribera (Márgenes)" },
                9: { alto: "9. Vegetación protectora de la ribera", bajo: "9. Vegetación protectora de la ribera" },
                10: { alto: "10. Amplitud de la vegetación ribereña", bajo: "10. Amplitud de la vegetación ribereña" }
            };

            // Función generadora de tablas del P3
            function generarTablaP3(tipo, puntajesObj, puntajeTotal) {
                let rowsHTML = '';
                for (let i = 1; i <= 10; i++) {
                    let nombreP = nombresParametrosP3[i][tipo.toLowerCase()];
                    let celdasHTML = '';
                    let sumaFila = 0;

                    if (i < 8) {
                        sumaFila = puntajesObj[`p${i}`] || 0;
                        celdasHTML = `<td style="padding: 4px; border: 1px solid #dee2e6; text-align: center;">${sumaFila}</td>`;
                    } else {
                        let valIzq = puntajesObj[`p${i}Izq`] || 0;
                        let valDer = puntajesObj[`p${i}Der`] || 0;
                        sumaFila = valIzq + valDer;
                        celdasHTML = `<td style="padding: 4px; border: 1px solid #dee2e6; text-align: center; color: #666;">I: <b>${valIzq}</b> &nbsp;|&nbsp; D: <b>${valDer}</b></td>`;
                    }

                    rowsHTML += `
                        <tr style="line-height: 1.2;">
                            <td style="padding: 4px; border: 1px solid #dee2e6; text-align: left;">${nombreP}</td>
                            ${celdasHTML}
                            <td style="padding: 4px; border: 1px solid #dee2e6; text-align: center; font-weight: bold;">${sumaFila}</td>
                        </tr>
                    `;
                }

                return `
                    <div style="page-break-inside: avoid; margin-bottom: 20px;">
                        <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">Matriz de Gradiente ${tipo}</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: center;">
                            <tr style="background: #e9ecef;">
                                <th style="padding: 4px; border: 1px solid #dee2e6; text-align: left; width: 60%;">Parámetro Evaluado</th>
                                <th style="padding: 4px; border: 1px solid #dee2e6; width: 25%;">Desglose / Márgenes</th>
                                <th style="padding: 4px; border: 1px solid #dee2e6; width: 15%;">Puntaje Fila</th>
                            </tr>
                            ${rowsHTML}
                            <tr style="background: #f8f9fa;">
                                <th colspan="2" style="padding: 6px; border: 1px solid #dee2e6; text-align: right;">PUNTAJE TOTAL DEL GRADIENTE:</th>
                                <th style="padding: 6px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; color: #333;">${puntajeTotal} / 200</th>
                            </tr>
                        </table>
                    </div>
                `;
            }

            // --- EXTRACCIÓN DE DATOS P4 ---
            const d4_form = p4 ? p4.datos_formulario : {};
            const d4_textos = d4_form.textos || {};
            const d4_fauna = d4_form.fauna_asociada || {};
            const d4_estim = d4_form.estimacion_preliminar || {};

            const llavesFauna = ['Perifiton', 'Algas filament.', 'Macrófitas', 'Macroinvertebrados', 'Peces', 'Porífera'];
            const llavesEstimacion = ['Gasteropoda', 'Bivalvia', 'Turbellaria', 'Oligochaeta', 'Hirudinea', 'Diptera', 'Amphipoda', 'Isopoda', 'Cangrejo', 'Camarón', 'Ephemeroptera', 'Plecoptera', 'Odonata', 'Hemiptera', 'Megaloptera', 'Trichoptera', 'Lepidoptera', 'Coleoptera'];

            // Etiqueta de abundancia según escala 0–4
            const etiquetaAbundancia = (val) => {
                const v = parseInt(val) || 0;
                const etiquetas = ['Ausente', 'Rara (1-3)', 'Común (3-9)', 'Abundante (>10)', 'Dominante (>50)'];
                return etiquetas[v] || '--';
            };

            // Parsear "otros hábitats" del formato "Nombre:valor, Nombre2:valor2"
            const otrosHabitatRows = (() => {
                const raw = d4_textos['otros_habitat'] || '';
                if (!raw.trim()) return '';
                return raw.split(', ').map(item => {
                    const [nombre, val] = item.split(':');
                    return `
                        <tr>
                            <td style="padding: 4px; border: 1px solid #dee2e6;">${nombre || '--'}</td>
                            <td style="padding: 4px; border: 1px solid #dee2e6; text-align: center;">${val || '0'}%</td>
                        </tr>
                    `;
                }).join('');
            })();

            // Generar filas de tabla para fauna/estimación.
            // Cada fila es su propio <tbody> con page-break-inside:avoid para que html2pdf
            // nunca corte el contenido visual de una fila, pero sí permita saltos ENTRE filas.
            function generarFilasMetrica(llaves, dataObj) {
                return llaves.map(llave => {
                    const val = parseInt(dataObj[llave]) || 0;
                    const barColor = ['#dee2e6', '#198754', '#0d6efd', '#ffc107', '#dc3545'][val];
                    const segmentos = [0, 1, 2, 3].map(i =>
                        `<td style="width:25%;padding:3px;border:1px solid #fff;background-color:${i < val ? barColor : '#f8f9fa'};"></td>`
                    ).join('');
                    return `
                        <tbody style="page-break-inside:avoid;">
                            <tr>
                                <td style="padding:5px 4px;border:1px solid #dee2e6;font-weight:bold;">${llave}</td>
                                <td style="padding:5px 4px;border:1px solid #dee2e6;text-align:center;font-weight:bold;color:#2b5c8f;">${val}</td>
                                <td style="padding:5px 4px;border:1px solid #dee2e6;">${etiquetaAbundancia(val)}</td>
                                <td style="padding:2px 3px;border:1px solid #dee2e6;">
                                    <table style="width:100%;border-collapse:collapse;height:16px;"><tr>${segmentos}</tr></table>
                                </td>
                            </tr>
                        </tbody>
                    `;
                }).join('');
            }

            // --- EXTRACCIÓN DE DATOS P5 ---
            const d5_form   = p5 ? p5.datos_formulario : {};
            const scoreBMWP = d5_form.puntaje_bmwp_total || 0;
            const familias  = d5_form.carrito || [];

            // Tabla de clasificación BMWP/MEX completa
            const tablaBMWP = [
                { min: 151, max: Infinity, categoria: 'Excelente',           calidad: 'Aguas muy limpias, no contaminadas',        color: '#0d6efd' },
                { min: 120, max: 150,      categoria: 'Buena',               calidad: 'Aguas no contaminadas o poco alteradas',     color: '#198754' },
                { min: 78,  max: 119,      categoria: 'Regular / Aceptable', calidad: 'Aguas con evidencia moderada de impacto',    color: '#20c997' },
                { min: 59,  max: 77,       categoria: 'Dudosa / Crítica',    calidad: 'Aguas moderadamente contaminadas',           color: '#ffc107' },
                { min: 39,  max: 58,       categoria: 'Contaminada',         calidad: 'Aguas contaminadas',                         color: '#fd7e14' },
                { min: 20,  max: 38,       categoria: 'Muy contaminada',     calidad: 'Aguas muy contaminadas',                     color: '#d63384' },
                { min: 0,   max: 19,       categoria: 'Extr. contaminada',   calidad: 'Aguas extremadamente contaminadas',          color: '#dc3545' },
            ];
            const clasifActual = tablaBMWP.find(r => scoreBMWP >= r.min && scoreBMWP <= r.max)
                              || tablaBMWP[tablaBMWP.length - 1];

            // 3. CONSTRUCCIÓN DEL DOCUMENTO HTML COMPLETO
            const docHTML = document.createElement('div');
            docHTML.style.padding = '40px';
            docHTML.style.fontFamily = 'Arial, sans-serif';
            docHTML.style.color = '#333';

            docHTML.innerHTML = `
                <div style="border-bottom: 3px solid #0d6efd; padding-bottom: 15px; margin-bottom: 20px;">
                    <h1 style="margin: 0; color: #0d6efd; font-size: 24px; font-weight: bold;">DEEP BUG - REPORTE TÉCNICO OFICIAL</h1>
                    <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 11px; letter-spacing: 1px;">SISTEMA DE BIOMONITOREO DE MACROINVERTEBRADOS</p>
                </div>

                <h2 style="color: white; background-color: #2b5c8f; padding: 6px; font-size: 14px; margin-top: 0; border-radius: 4px;">P-001. PLAN DE MUESTREO</h2>
                
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">1. Datos Generales</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6; width: 15%;">Proyecto:</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6; width: 35%;">${nombreProyecto}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6; width: 15%;">Zona de Estudio:</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6; width: 35%;">${nombreZona}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Contacto:</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d1_gen.contacto || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Provincia(s):</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d1_gen.provincia || '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Objetivo:</td>
                        <td colspan="3" style="padding: 4px; border: 1px solid #dee2e6;">${d1_gen.objetivo || '--'}</td>
                    </tr>
                </table>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">2. Identificación (Estaciones)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px; text-align: center;">
                    <tr style="background: #e9ecef;">
                        <th style="padding: 4px; border: 1px solid #dee2e6;">N° Control</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Lugar</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Tipo Muestra</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Fecha</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Hora</th>
                    </tr>
                    ${d1_est.length > 0 ? d1_est.map(e => `
                    <tr>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${e.control || '--'}</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${e.lugar || '--'}</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${e.tipo_muestra || '--'}</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${e.fecha || '--'}</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${e.hora || '--'}</td>
                    </tr>
                    `).join('') : '<tr><td colspan="5" style="padding: 4px; border: 1px solid #dee2e6; text-align: center;">Sin estaciones registradas</td></tr>'}
                </table>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">3. Parámetros a evaluar (In Situ)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 15px; text-align: center; table-layout: fixed; word-wrap: break-word;">
                    <thead style="display: table-row-group;">
                        <tr style="background: #e9ecef;">
                            <th style="border: 1px solid #dee2e6; border-bottom: none; text-align: left; width: 18%; vertical-align: top;"><div style="margin-top: 8px; margin-left: 4px;">Parámetro</div></th>
                            <th style="border: 1px solid #dee2e6; border-bottom: none; width: 10%; vertical-align: top;"><div style="margin-top: 8px;">Unidad</div></th>
                            <th colspan="8" style="padding: 4px; border: 1px solid #dee2e6; vertical-align: middle;">Estaciones de Muestreo</th>
                            <th style="border: 1px solid #dee2e6; border-bottom: none; text-align: left; width: 32%; vertical-align: top;"><div style="margin-top: 8px; margin-left: 4px;">Obs.</div></th>
                        </tr>
                        <tr style="background: #e9ecef;">
                            <th style="border: 1px solid #dee2e6; border-top: none; padding: 4px;"></th>
                            <th style="border: 1px solid #dee2e6; border-top: none; padding: 4px;"></th>
                            ${[1,2,3,4,5,6,7,8].map(i => `<th style="padding: 4px; border: 1px solid #dee2e6; width: 5%; vertical-align: middle;">${i}</th>`).join('')}
                            <th style="border: 1px solid #dee2e6; border-top: none; padding: 4px;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listParametrosInSitu.map(param => {
                            const dataP = d1_par[param] || {};
                            return `<tr style="line-height: 1.1;">
                                <td style="padding: 4px; border: 1px solid #dee2e6; text-align: left; font-weight: bold; word-break: break-word;">${param}</td>
                                <td style="padding: 4px; border: 1px solid #dee2e6; word-break: break-word;">${dataP.unidad || '--'}</td>
                                ${[1,2,3,4,5,6,7,8].map(i => `<td style="padding: 4px; border: 1px solid #dee2e6; word-break: break-word;">${dataP[`e${i}`] || '--'}</td>`).join('')}
                                <td style="padding: 4px; border: 1px solid #dee2e6; text-align: left;">${dataP.obs || '--'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">4. Responsables</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6; width: 25%;">Conductor:</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6; width: 25%;">${d1_res.conductor || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6; width: 25%;">Fecha plan:</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6; width: 25%;">${d1_res.fecha_elaboracion_plan || '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Investigador Responsable:</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${responsable}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Técnicos (Equipo):</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6; color: #666;">
                            ${(d1_res.tecnicos && d1_res.tecnicos.length > 0) ? d1_res.tecnicos.join(', ') : colaboradoresTexto}
                        </td>
                    </tr>
                </table>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">5. Verificación de Materiales</h3>
                <div style="font-size: 10px; margin-bottom: 8px;">
                    <strong>a) Equipos y Herramientas:</strong><br>
                    <div style="display: flex; flex-wrap: wrap; margin-top: 5px;">
                        ${listEquipos.map(eq => {
                            const checked = d1_mat.equipos?.[eq] ? 'X' : '';
                            const bg = checked ? '#e9ecef' : 'transparent';
                            return `
                            <div style="width: 33%; margin-bottom: 6px; display: flex; align-items: center;">
                                <div style="width: 12px; height: 12px; border: 1px solid #555; border-radius: 2px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; margin-right: 6px; background-color: ${bg};">${checked}</div> 
                                <span>${eq}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                <div style="font-size: 10px; margin-bottom: 15px;">
                    <strong>b) Insumos (Cantidades preparadas):</strong><br>
                    <div style="display: flex; flex-wrap: wrap; margin-top: 5px;">
                        ${listInsumos.map(ins => `<div style="width: 25%; border-bottom: 1px dotted #ccc; padding-bottom: 2px; margin-bottom: 4px; padding-right: 10px;"><strong>${ins}:</strong> ${d1_mat.insumos?.[ins] || '--'}</div>`).join('')}
                    </div>
                </div>

                <!-- ====== P-002 ====== -->
                <div style="page-break-before: always;"></div>
                <h2 style="color: white; background-color: #2b5c8f; padding: 6px; font-size: 14px; margin-top: 0; border-radius: 4px;">P-002. CARACTERIZACIÓN VISUAL Y FISICOQUÍMICA</h2>
                
                ${imgP2Html}

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">1. Datos Generales y Localización</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6; width: 15%;">N° Control:</td><td style="padding: 4px; border: 1px solid #dee2e6; width: 35%;">${d2.n_control || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6; width: 15%;">Nombre Río:</td><td style="padding: 4px; border: 1px solid #dee2e6; width: 35%;">${d2.nombre_rio || '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">ID Estación:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.id_estacion || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Orden Río:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.orden_rio || '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Cuenca:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.cuenca || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Altura:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.altura || '--'} msnm</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Lat / Lng:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.latitud || '--'} , ${d2.longitud || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Localidad:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.localidad || '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Provincia:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.provincia || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Distrito/Correg:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.distrito || '--'} / ${d2.corregimiento || '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Llenado por:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.llenado_por || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Fecha/Hora:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.fecha || '--'} - ${d2.hora || '--'} ${d2_form.horario || ''}</td>
                    </tr>
                </table>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">2. Clima y Cuerpo de Agua</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6; width: 25%;">Clima Actual:</td><td style="padding: 4px; border: 1px solid #dee2e6; width: 25%;">${clima}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6; width: 25%;">Lluvia 7 días previos:</td><td style="padding: 4px; border: 1px solid #dee2e6; width: 25%;">${d2_form.lluvias || '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Nubosidad / Temp Amb:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.nubosidad || '--'}% / ${d2.temp_amb || '--'}°C</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Subsistema / Tipología:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2_form.subsistema || '--'} / ${d2_form.tipologia || '--'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Temp Agua (Radio):</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2_form.temp_agua_radio || '--'}</td>
                        <td style="padding: 4px; font-weight: bold; background: #f8f9fa; border: 1px solid #dee2e6;">Área Cuenca:</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.area_cuenca || '--'} Kms</td>
                    </tr>
                </table>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">3. Cobertura Boscosa y Usos de la Tierra</h3>
                <div style="display: flex; gap: 10px; font-size: 10px; margin-bottom: 15px; page-break-inside: avoid;">
                    <div style="flex: 1; border: 1px solid #dee2e6; padding: 8px; border-radius: 4px; background: #fafafa;">
                        <strong style="color: #2b5c8f;">Bosques:</strong> ${bosques}<br>
                        <strong style="color: #2b5c8f;">Estado Sucesional:</strong> ${sucesional}<br>
                        <strong style="color: #2b5c8f;">Vegetación Arbustiva:</strong> ${veg_arbustiva}
                    </div>
                    <div style="flex: 1; border: 1px solid #dee2e6; padding: 8px; border-radius: 4px; background: #fafafa;">
                        <strong style="color: #2b5c8f;">Cultivos Permanentes:</strong> ${cult_perm} ${d2.otros_perm ? '('+d2.otros_perm+')' : ''}<br>
                        <strong style="color: #2b5c8f;">Cultivos Anuales:</strong> ${cult_anuales} ${d2.otros_anuales ? '('+d2.otros_anuales+')' : ''}<br>
                        <strong style="color: #2b5c8f;">Otros Usos:</strong> ${otros_usos} ${d2.otros_usos_texto ? '('+d2.otros_usos_texto+')' : ''}
                    </div>
                </div>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">4. Descargas y Modificaciones</h3>
                <div style="display: flex; gap: 10px; font-size: 10px; margin-bottom: 15px; page-break-inside: avoid;">
                    <div style="flex: 1; border: 1px solid #dee2e6; padding: 8px; border-radius: 4px;">
                        <strong style="color: #2b5c8f;">Descargas de Efluentes:</strong> ${descargas}<br>
                        <strong style="color: #2b5c8f;">Tipo de Efluente:</strong> ${tipo_efluente}<br>
                        <strong style="color: #2b5c8f;">Vegetación Acuática Dominante:</strong> ${veg_acuatica}<br>
                        <strong style="color: #2b5c8f;">Especies/Cobertura:</strong> ${d2.esp_dominantes || '--'} / ${d2.porcentaje_veg || '--'}%
                    </div>
                    <div style="flex: 1; border: 1px solid #dee2e6; padding: 8px; border-radius: 4px;">
                        <strong style="color: #2b5c8f;">Modificaciones al Cuerpo:</strong><br>
                        Residuos: ${d2_form.residuos||'--'} | Canalizado: ${d2_form.canalizado||'--'} | Presas: ${d2_form.presas||'--'}<br>
                        Rectificación: ${d2_form.rectificacion||'--'} | Aceites: ${d2_form.aceites||'--'} | Extracciones: ${d2_form.extracciones||'--'}<br>
                        <strong style="color: #2b5c8f; margin-top: 5px; display: inline-block;">Erosión Local:</strong> ${d2_form.erosion || '--'}
                    </div>
                </div>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">5. Calidad del Agua (In Situ P2)</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px; text-align: center; page-break-inside: avoid;">
                    <tr style="background: #e9ecef;">
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Temp (°C)</th><th style="padding: 4px; border: 1px solid #dee2e6;">TDS</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Ox. Disuelto</th><th style="padding: 4px; border: 1px solid #dee2e6;">Nitrito</th><th style="padding: 4px; border: 1px solid #dee2e6;">Turbiedad</th>
                    </tr>
                    <tr>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_temp || '--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_tds || '--'}</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_od || '--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_nitrito || '--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_turb || '--'}</td>
                    </tr>
                    <tr style="background: #e9ecef;">
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Nitrato</th><th style="padding: 4px; border: 1px solid #dee2e6;">pH</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Salinidad</th><th style="padding: 4px; border: 1px solid #dee2e6;">Conductividad</th><th style="padding: 4px; border: 1px solid #dee2e6;">Fosfatos</th>
                    </tr>
                    <tr>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_nitrato || '--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_ph || '--'}</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_salinidad || '--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_cond || '--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_fosfatos || '--'}</td>
                    </tr>
                    <tr>
                        <th colspan="2" style="padding: 4px; border: 1px solid #dee2e6; background: #e9ecef;">Equipos Utilizados:</th>
                        <td colspan="3" style="padding: 4px; border: 1px solid #dee2e6;">${d2.ca_equipos || '--'}</td>
                    </tr>
                    <tr>
                        <th colspan="2" style="padding: 4px; border: 1px solid #dee2e6; background: #e9ecef;">Olores / Colores:</th>
                        <td colspan="3" style="padding: 4px; border: 1px solid #dee2e6;">${olor} / ${color}</td>
                    </tr>
                </table>

                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">6. Mediciones Estructurales</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px; text-align: center; page-break-inside: avoid;">
                    <tr style="background: #2b5c8f; color: white;">
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Dimensión</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">Métrica</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">P1</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">P2</th>
                        <th style="padding: 4px; border: 1px solid #dee2e6;">P3</th>
                    </tr>
                    <tr><td rowspan="3" style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold; background: #f8f9fa; vertical-align: middle;">Ancho (m)</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M0</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m0_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m0_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m0_p3||'--'}</td>
                    </tr>
                    <tr><td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M50</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m50_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m50_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m50_p3||'--'}</td>
                    </tr>
                    <tr><td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M100</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m100_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m100_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.ancho_m100_p3||'--'}</td>
                    </tr>
                    <tr><td rowspan="3" style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold; background: #f8f9fa; vertical-align: middle;">Profundidad (m)</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M0</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m0_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m0_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m0_p3||'--'}</td>
                    </tr>
                    <tr><td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M50</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m50_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m50_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m50_p3||'--'}</td>
                    </tr>
                    <tr><td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M100</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m100_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m100_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.prof_m100_p3||'--'}</td>
                    </tr>
                    <tr><td rowspan="3" style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold; background: #f8f9fa; vertical-align: middle;">Velocidad (m/s)</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M0</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m0_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m0_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m0_p3||'--'}</td>
                    </tr>
                    <tr><td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M50</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m50_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m50_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m50_p3||'--'}</td>
                    </tr>
                    <tr><td style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold;">M100</td>
                        <td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m100_p1||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m100_p2||'--'}</td><td style="padding: 4px; border: 1px solid #dee2e6;">${d2.vel_m100_p3||'--'}</td>
                    </tr>
                </table>

                <div style="font-size: 10px; margin-bottom: 20px; border: 1px solid #dee2e6; padding: 8px; border-radius: 4px; background: #fafafa; display: flex; justify-content: space-around;">
                    <span><strong style="color: #2b5c8f;">Cobertura Dosel:</strong> ${d2_form.dosel || '--'}</span>
                    <span><strong style="color: #2b5c8f;">Morfología Rápidos:</strong> ${d2.morf_rapidos || '--'}%</span>
                    <span><strong style="color: #2b5c8f;">Morfología Pozas:</strong> ${d2.morf_pozas || '--'}%</span>
                </div>

                <!-- ====== P-003 ====== -->
                <div style="page-break-before: always;"></div>
                <h2 style="color: white; background-color: #2b5c8f; padding: 6px; font-size: 14px; margin-top: 0; border-radius: 4px;">P-003. CARACTERIZACIÓN DEL HÁBITAT</h2>
                <p style="font-size: 11px; color: #666; margin-bottom: 15px;">Se muestran las matrices de evaluación para ambos gradientes (Alto y Bajo).</p>
                
                ${generarTablaP3('Alto', puntajesAlto, scoreAltoTotal)}
                ${generarTablaP3('Bajo', puntajesBajo, scoreBajoTotal)}

                <!-- ====== P-004 ====== -->
                <div style="page-break-before: always;"></div>
                <h2 style="color: white; background-color: #2b5c8f; padding: 6px; font-size: 14px; margin-top: 0; border-radius: 4px;">P-004. MUESTREO MULTIHÁBITAT</h2>

                <!-- 4.1 Tipos de hábitat -->
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">1. Tipos de Hábitat y Porcentajes</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px; page-break-inside: avoid;">
                    <tr style="background: #e9ecef;">
                        <th style="padding: 5px; border: 1px solid #dee2e6; text-align: left; width: 55%;">Hábitat</th>
                        <th style="padding: 5px; border: 1px solid #dee2e6; text-align: center; width: 15%;">Porcentaje (%)</th>
                        <th style="padding: 5px; border: 1px solid #dee2e6; text-align: center; width: 30%;">Representación visual</th>
                    </tr>
                    ${[
                        ['H1. Sustrato duro en rápidos',  d4_textos['porcentaje_h1']],
                        ['H2. Detrito vegetal',           d4_textos['porcentaje_h2']],
                        ['H3. Orillas vegetadas',         d4_textos['porcentaje_h3']],
                        ['H4. Macrófitas acuáticas',      d4_textos['porcentaje_h4']],
                        ['H5. Arena u otros sedimentos finos', d4_textos['porcentaje_h5']],
                    ].map(([nombre, pct]) => {
                        const v = parseInt(pct) || 0;
                        const filled = Math.round(v / 10);
                        const bar = Array.from({length: 10}, (_, i) =>
                            `<td style="width:10%;height:12px;background:${i < filled ? '#198754' : '#dee2e6'};border:1px solid #fff;"></td>`
                        ).join('');
                        return `
                        <tr>
                            <td style="padding: 5px; border: 1px solid #dee2e6;">${nombre}</td>
                            <td style="padding: 5px; border: 1px solid #dee2e6; text-align: center; font-weight: bold;">${v}%</td>
                            <td style="padding: 3px; border: 1px solid #dee2e6;">
                                <table style="width:100%;border-collapse:collapse;"><tr>${bar}</tr></table>
                            </td>
                        </tr>`;
                    }).join('')}
                    ${otrosHabitatRows ? `
                        <tr style="background: #fafafa;">
                            <td colspan="3" style="padding: 4px; border: 1px solid #dee2e6; font-weight: bold; color: #2b5c8f; font-size: 10px;">Otros hábitats registrados:</td>
                        </tr>
                        ${otrosHabitatRows}
                    ` : ''}
                </table>

                <!-- 4.2 Arrastres -->
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">2. Número de Arrastres por Hábitat</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px; text-align: center; page-break-inside: avoid;">
                    <tr style="background: #e9ecef;">
                        <th style="padding: 5px; border: 1px solid #dee2e6;">H1. Sustrato duro</th>
                        <th style="padding: 5px; border: 1px solid #dee2e6;">H2. Detrito vegetal</th>
                        <th style="padding: 5px; border: 1px solid #dee2e6;">H3. Orillas veg.</th>
                        <th style="padding: 5px; border: 1px solid #dee2e6;">H4. Macrófitas</th>
                        <th style="padding: 5px; border: 1px solid #dee2e6;">H5. Sedimentos finos</th>
                        <th style="padding: 5px; border: 1px solid #dee2e6;">Método de colecta</th>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border: 1px solid #dee2e6;">${d4_textos['arrastre_h1'] || '0'}</td>
                        <td style="padding: 5px; border: 1px solid #dee2e6;">${d4_textos['arrastre_h2'] || '0'}</td>
                        <td style="padding: 5px; border: 1px solid #dee2e6;">${d4_textos['arrastre_h3'] || '0'}</td>
                        <td style="padding: 5px; border: 1px solid #dee2e6;">${d4_textos['arrastre_h4'] || '0'}</td>
                        <td style="padding: 5px; border: 1px solid #dee2e6;">${d4_textos['arrastre_h5'] || '0'}</td>
                        <td style="padding: 5px; border: 1px solid #dee2e6;">${d4_textos['metodo_colecta'] || 'Red de mano tipo D (500 µm)'}</td>
                    </tr>
                </table>

                <!-- 4.3 Fauna asociada -->
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">3. Fauna Asociada</h3>
                <div style="font-size: 9px; color: #555; margin-bottom: 8px; padding: 4px 8px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
                    Escala de abundancia: &nbsp; <b>0</b> = Ausente &nbsp;|&nbsp; <b>1</b> = Rara (1-3) &nbsp;|&nbsp; <b>2</b> = Común (3-9) &nbsp;|&nbsp; <b>3</b> = Abundante (&gt;10) &nbsp;|&nbsp; <b>4</b> = Dominante (&gt;50)
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #e9ecef;">
                            <th style="padding: 5px; border: 1px solid #dee2e6; text-align: left; width: 30%;">Organismo</th>
                            <th style="padding: 5px; border: 1px solid #dee2e6; text-align: center; width: 10%;">Valor</th>
                            <th style="padding: 5px; border: 1px solid #dee2e6; text-align: left; width: 25%;">Categoría</th>
                            <th style="padding: 5px; border: 1px solid #dee2e6; text-align: left; width: 35%;">Abundancia</th>
                        </tr>
                    </thead>
                    ${generarFilasMetrica(llavesFauna, d4_fauna)}
                </table>

                <!-- 4.4 Estimación preliminar — salto de página propio para garantizar que la tabla entera sea visible -->
                <div style="page-break-before: always;"></div>
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">4. Estimación Preliminar en Campo (Macroinvertebrados)</h3>
                <div style="font-size: 9px; color: #555; margin-bottom: 8px; padding: 4px 8px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;">
                    Escala de abundancia: &nbsp; <b>0</b> = Ausente &nbsp;|&nbsp; <b>1</b> = Rara (1-3) &nbsp;|&nbsp; <b>2</b> = Común (3-9) &nbsp;|&nbsp; <b>3</b> = Abundante (&gt;10) &nbsp;|&nbsp; <b>4</b> = Dominante (&gt;50)
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #e9ecef;">
                            <th style="padding: 5px; border: 1px solid #dee2e6; text-align: left; width: 30%;">Taxón</th>
                            <th style="padding: 5px; border: 1px solid #dee2e6; text-align: center; width: 10%;">Valor</th>
                            <th style="padding: 5px; border: 1px solid #dee2e6; text-align: left; width: 25%;">Categoría</th>
                            <th style="padding: 5px; border: 1px solid #dee2e6; text-align: left; width: 35%;">Abundancia</th>
                        </tr>
                    </thead>
                    ${generarFilasMetrica(llavesEstimacion, d4_estim)}
                </table>

                <!-- 4.5 Observaciones -->
                ${d4_textos['observaciones'] ? `
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">5. Observaciones o Comentarios</h3>
                <div style="font-size: 10px; border: 1px solid #dee2e6; padding: 10px; border-radius: 4px; background: #fafafa; margin-bottom: 20px; white-space: pre-wrap;">${d4_textos['observaciones']}</div>
                ` : ''}

                <!-- ====== P-005 ====== -->
                <div style="page-break-before: always;"></div>
                <h2 style="color: white; background-color: #2b5c8f; padding: 6px; font-size: 14px; margin-top: 0; border-radius: 4px;">P-005. IDENTIFICACIÓN DE MACROINVERTEBRADOS (BMWP/MEX)</h2>

                <!-- 5.1 Tabla de familias registradas -->
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">1. Familias de Macroinvertebrados Registradas</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 5px;">
                    <thead>
                        <tr style="background: #2b5c8f; color: white;">
                            <th style="padding: 6px 8px; border: 1px solid #1a4a7a; text-align: left; width: 50%;">Familia Identificada</th>
                            <th style="padding: 6px 8px; border: 1px solid #1a4a7a; text-align: center; width: 25%;">Individuos</th>
                            <th style="padding: 6px 8px; border: 1px solid #1a4a7a; text-align: center; width: 25%;">Índice BMWP</th>
                        </tr>
                    </thead>
                    ${familias.length > 0
                        ? familias.map((f, idx) => `
                            <tbody style="page-break-inside: avoid;">
                                <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8f9fa'};">
                                    <td style="padding: 5px 8px; border: 1px solid #dee2e6; font-weight: bold;">${f.nombre || '--'}</td>
                                    <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">${f.cantidad || 0}</td>
                                    <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center; font-weight: bold; color: #198754;">${f.valor_bmwp || 0}</td>
                                </tr>
                            </tbody>`).join('')
                        : `<tbody><tr><td colspan="3" style="padding: 10px; border: 1px solid #dee2e6; text-align: center; color: #6c757d; font-style: italic;">Sin familias registradas en este protocolo</td></tr></tbody>`
                    }
                    <!-- Fila de totales -->
                    <tbody style="page-break-inside: avoid;">
                        <tr style="background: #e9ecef;">
                            <th style="padding: 6px 8px; border: 1px solid #dee2e6; text-align: right;">TOTALES:</th>
                            <th style="padding: 6px 8px; border: 1px solid #dee2e6; text-align: center;">
                                ${familias.reduce((acc, f) => acc + (parseInt(f.cantidad) || 0), 0)}
                            </th>
                            <th style="padding: 6px 8px; border: 1px solid #dee2e6; text-align: center; font-size: 12px; color: #2b5c8f;">
                                ${scoreBMWP} pts
                            </th>
                        </tr>
                    </tbody>
                </table>
                <p style="font-size: 9px; color: #6c757d; margin-bottom: 20px;">
                    * El índice BMWP/MEX asigna un puntaje a cada familia según su tolerancia a la contaminación. La sumatoria total determina la calidad biológica del cuerpo de agua.
                </p>

                <!-- 5.2 Resultado y clasificación -->
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 12px;">2. Resultado BMWP/MEX y Calidad Biológica</h3>

                <!-- Tarjeta de puntaje obtenido -->
                <div style="border: 2px solid ${clasifActual.color}; border-radius: 8px; padding: 14px 18px; margin-bottom: 16px; display: flex; align-items: center; gap: 20px; page-break-inside: avoid;">
                    <div style="flex: 0 0 auto; text-align: center; min-width: 90px;">
                        <div style="font-size: 9px; color: #6c757d; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Puntaje BMWP</div>
                        <div style="font-size: 30px; font-weight: bold; color: ${clasifActual.color}; line-height: 1.1;">${scoreBMWP}</div>
                        <div style="font-size: 9px; color: #6c757d;">puntos</div>
                    </div>
                    <div style="flex: 1; border-left: 2px solid #dee2e6; padding-left: 18px;">
                        <div style="font-size: 13px; font-weight: bold; color: ${clasifActual.color}; margin-bottom: 4px;">${clasifActual.categoria.toUpperCase()}</div>
                        <div style="font-size: 11px; color: #333;">${clasifActual.calidad}</div>
                    </div>
                </div>

                <!-- Tabla de clasificación completa BMWP/MEX -->
                <h3 style="color: #2b5c8f; border-bottom: 1px solid #dee2e6; padding-bottom: 2px; font-size: 12px; margin-bottom: 8px;">3. Escala de Clasificación BMWP/MEX</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; page-break-inside: avoid;">
                    <thead>
                        <tr style="background: #e9ecef;">
                            <th style="padding: 6px 8px; border: 1px solid #dee2e6; text-align: left; width: 22%;">Categoría</th>
                            <th style="padding: 6px 8px; border: 1px solid #dee2e6; text-align: center; width: 18%;">Rango (pts)</th>
                            <th style="padding: 6px 8px; border: 1px solid #dee2e6; text-align: left; width: 50%;">Calidad Biológica</th>
                            <th style="padding: 6px 8px; border: 1px solid #dee2e6; text-align: center; width: 10%;">Color</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tablaBMWP.map(r => {
                            const esActual = (scoreBMWP >= r.min && scoreBMWP <= r.max);
                            const rango = r.max === Infinity ? `> ${r.min}` : `${r.min} – ${r.max}`;
                            return `
                            <tr style="background-color: ${esActual ? r.color + '22' : 'transparent'}; font-weight: ${esActual ? 'bold' : 'normal'};">
                                <td style="padding: 5px 8px; border: 1px solid #dee2e6; color: ${r.color}; font-weight: bold;">
                                    ${esActual ? '▶ ' : ''}${r.categoria}
                                </td>
                                <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">${rango}</td>
                                <td style="padding: 5px 8px; border: 1px solid #dee2e6;">${r.calidad}</td>
                                <td style="padding: 5px 8px; border: 1px solid #dee2e6; text-align: center;">
                                    <div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${r.color}; margin: 0 auto;"></div>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>

                <!-- Pie de página del reporte -->
                <div style="margin-top: 30px; border-top: 2px solid #dee2e6; padding-top: 12px; font-size: 9px; color: #6c757d; display: flex; justify-content: space-between;">
                    <span>Deep Bug &mdash; Sistema de Biomonitoreo de Macroinvertebrados</span>
                    <span>Generado el: ${new Date().toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>Proyecto: ${nombreProyecto}</span>
                </div>
            `;

            // 4. Parámetros y descarga
            const opcionesConfig = {
                margin: 10,
                filename: `Reporte_${nombreProyecto.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().set(opcionesConfig).from(docHTML).save();

        } catch (error) {
            console.error("Error al generar el PDF:", error);
            alert("Ocurrió un error al compilar el documento PDF. Revisa la consola para más detalles.");
        } finally {
            btnPDF.innerHTML = '<i class="fas fa-file-pdf me-2"></i> Descargar Reporte PDF';
            btnPDF.disabled = false;
        }
    });
});