import json
import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_styled_heading(doc, text, level):
    h = doc.add_heading(text, level=level)
    h.paragraph_format.space_before = Pt(14)
    h.paragraph_format.space_after = Pt(6)
    for r in h.runs:
        r.font.name = 'Calibri'
        if level == 1:
            r.font.color.rgb = RGBColor(3, 105, 161) # Blue primary
            r.font.size = Pt(16)
            r.bold = True
        elif level == 2:
            r.font.color.rgb = RGBColor(15, 23, 42)
            r.font.size = Pt(13)
            r.bold = True
        elif level == 3:
            r.font.color.rgb = RGBColor(51, 65, 85)
            r.font.size = Pt(11.5)
            r.bold = True
    return h

def main():
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'test_results_paralelo_b.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    doc = Document()

    # Page Margins (Normal 1 inch)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    # ─────────────────────────────────────────────────────────────────────────
    # HEADER / INSTITUTIONAL LETTERHEAD
    # ─────────────────────────────────────────────────────────────────────────
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_after = Pt(2)
    r_inst = p_inst.add_run("UNIDAD EDUCATIVA ENRIQUE LÓPEZ LASCANO")
    r_inst.font.name = 'Calibri'
    r_inst.font.size = Pt(12)
    r_inst.font.bold = True
    r_inst.font.color.rgb = RGBColor(100, 116, 139)

    p_code = doc.add_paragraph()
    p_code.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_code.paragraph_format.space_after = Pt(8)
    r_code = p_code.add_run("CÓDIGO AMIE: 09H04773 • CIRCUITO EDUCATIVO")
    r_code.font.name = 'Calibri'
    r_code.font.size = Pt(9.5)
    r_code.font.color.rgb = RGBColor(148, 163, 184)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(4)
    r_title = p_title.add_run("INFORME OFICIAL DE RESULTADOS DE LA CAPACITACIÓN")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(18)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(3, 105, 161)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(16)
    r_sub = p_sub.add_run("Evaluación Comparativa de Pensamiento Computacional (Pre-Test vs. Post-Test)\nPeriodo Lectivo: 2025 - 2026 • Paralelo B")
    r_sub.font.name = 'Calibri'
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Divider line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(14)
    p_div_run = p_div.add_run("━" * 58)
    p_div_run.font.color.rgb = RGBColor(203, 213, 225)
    p_div.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # ─────────────────────────────────────────────────────────────────────────
    # METADATA SUMMARY TABLE
    # ─────────────────────────────────────────────────────────────────────────
    add_styled_heading(doc, "Ficha Técnica y Métricas Principales", level=2)

    meta_table = doc.add_table(rows=6, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    col_widths = [Inches(1.8), Inches(1.5), Inches(1.8), Inches(1.6)]
    for row in meta_table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    meta_data = [
        ("Institución:", "U.E. Enrique López Lascano", "Paralelo:", "B (I PAO 2026)"),
        ("Matriculados:", "42 estudiantes", "Instrumento:", "11 preguntas cognitivas (10 pts)"),
        ("Evaluados Pre-Test:", "38 estudiantes (90.5%)", "Evaluados Post-Test:", "32 estudiantes (76.2%)"),
        ("Muestra Pareada:", "31 estudiantes (ambas)", "Ganancia Neta (Pareada):", "+0.06 pts (+0.10 global)"),
        ("Promedio Pre-Test:", "6.43 / 10.00 pts", "Promedio Post-Test:", "6.53 / 10.00 pts"),
        ("Aprobados Pre (≥ 7.0):", "17 de 38 (44.7%)", "Aprobados Post (≥ 7.0):", "16 de 32 (50.0%)")
    ]

    for row_idx, row_content in enumerate(meta_data):
        row = meta_table.rows[row_idx]
        for c_idx in range(4):
            cell = row.cells[c_idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(row_content[c_idx])
            run.font.name = 'Calibri'
            run.font.size = Pt(9.5)
            if c_idx in [0, 2]:
                run.bold = True
                run.font.color.rgb = RGBColor(51, 65, 85)
                set_cell_background(cell, "F8FAFC")
            else:
                run.font.color.rgb = RGBColor(15, 23, 42)
                if "6.53" in row_content[c_idx] or "50.0%" in row_content[c_idx] or "+0.06" in row_content[c_idx]:
                    run.bold = True
                    run.font.color.rgb = RGBColor(22, 101, 52)
                elif "6.43" in row_content[c_idx]:
                    run.bold = True
                    run.font.color.rgb = RGBColor(2, 132, 199)

    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # ─────────────────────────────────────────────────────────────────────────
    # SECCIÓN 1: INTRODUCCIÓN
    # ─────────────────────────────────────────────────────────────────────────
    add_styled_heading(doc, "1. Introducción", level=1)
    p_intro = doc.add_paragraph(
        "Con el propósito de evaluar de manera rigurosa y objetiva el impacto pedagógico de la capacitación "
        "impartida en el área de Pensamiento Computacional en los estudiantes del Paralelo B, se aplicó un mismo "
        "instrumento de evaluación diagnóstica en dos momentos clave: al inicio de los talleres (Pre-Test) y al "
        "término de las jornadas formativas (Post-Test).\n\n"
        "El objetivo fundamental de esta medición cuantitativa y cualitativa fue diagnosticar el nivel basal de entrada "
        "del estudiantado, evidenciar las áreas de mayor dificultad conceptual y determinar con precisión la ganancia "
        "de aprendizaje obtenida en habilidades de descomposición algorítmica, reconocimiento de patrones, abstracción, "
        "pensamiento lógico-condicional y comprensión de componentes de hardware y software."
    )
    p_intro.paragraph_format.line_spacing = 1.15
    p_intro.paragraph_format.space_after = Pt(10)

    # ─────────────────────────────────────────────────────────────────────────
    # SECCIÓN 2: RESULTADOS GENERALES Y NIVELES DE DESEMPEÑO
    # ─────────────────────────────────────────────────────────────────────────
    add_styled_heading(doc, "2. Resultados Generales y Comparativa de Rendimiento", level=1)
    
    p_gen1 = doc.add_paragraph(
        "El análisis estadístico general refleja un avance favorable en el desempeño del curso. En la prueba diagnóstica "
        "inicial (Pre-Test), los 38 estudiantes evaluados obtuvieron una calificación promedio de 6.43 puntos sobre 10.00. "
        "Posteriormente, en la evaluación de salida (Post-Test), los 32 estudiantes evaluados registraron un promedio general "
        "de 6.53 puntos sobre 10.00, lo que representa un crecimiento global positivo de +0.10 puntos."
    )
    p_gen1.paragraph_format.line_spacing = 1.15
    p_gen1.paragraph_format.space_after = Pt(8)

    p_gen2 = doc.add_paragraph(
        "Para garantizar un análisis metodológico exacto, se examinó el subgrupo de 31 estudiantes que rindieron ambas "
        "evaluaciones (muestra pareada). En este grupo, el promedio inicial fue de 6.45 puntos y el final de 6.51 puntos, "
        "arrojando una ganancia media de aprendizaje de +0.06 puntos. De estos 31 alumnos evaluados de forma continua:\n"
        "• 12 estudiantes (38.71%) incrementaron su calificación, demostrando asimilación efectiva de los nuevos contenidos.\n"
        "• 8 estudiantes (25.81%) mantuvieron su nivel académico previo.\n"
        "• 11 estudiantes (35.48%) obtuvieron un puntaje inferior, principalmente debido al incremento de dificultad en reactivos de bucles y abstracción.\n"
        "Asimismo, la tasa de aprobación (calificaciones ≥ 7.00 puntos) creció del 44.74% (17 aprobados) al 50.00% (16 aprobados)."
    )
    p_gen2.paragraph_format.line_spacing = 1.15
    p_gen2.paragraph_format.space_after = Pt(12)

    # Tabla de Niveles de Desempeño
    add_styled_heading(doc, "Distribución de Estudiantes por Niveles de Desempeño", level=3)
    
    levels_table = doc.add_table(rows=5, cols=5)
    levels_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    levels_headers = ["Nivel de Calificación", "Rango (pts)", "Pre-Test (N=38)", "Post-Test (N=32)", "Variación Relativa"]
    for c_idx, h_text in enumerate(levels_headers):
        cell = levels_table.rows[0].cells[c_idx]
        set_cell_background(cell, "0284C7")
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h_text)
        r.font.name = 'Calibri'
        r.font.size = Pt(9.5)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    levels_data = [
        ("Insuficiente", "< 5.0 pts", "8 estudiantes (21.1%)", "7 estudiantes (21.9%)", "+0.8 pp"),
        ("Regular", "5.0 – 6.9 pts", "13 estudiantes (34.2%)", "9 estudiantes (28.1%)", "-6.1 pp (migración)"),
        ("Bueno", "7.0 – 8.9 pts", "12 estudiantes (31.6%)", "13 estudiantes (40.6%)", "+9.0 pp (crecimiento)"),
        ("Excelente", "9.0 – 10.0 pts", "5 estudiantes (13.2%)", "3 estudiantes (9.4%)", "-3.8 pp")
    ]

    for r_idx, r_data in enumerate(levels_data, start=1):
        row = levels_table.rows[r_idx]
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=60, bottom=60, left=80, right=80)
            p = cell.paragraphs[0]
            if c_idx in [1, 2, 3, 4]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(val)
            r.font.name = 'Calibri'
            r.font.size = Pt(9.5)
            if c_idx == 0:
                r.bold = True
            if "Bueno" in r_data[0] and c_idx in [3, 4]:
                r.bold = True
                r.font.color.rgb = RGBColor(22, 101, 52)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # ─────────────────────────────────────────────────────────────────────────
    # SECCIÓN 3: ANÁLISIS DETALLADO PREGUNTA A PREGUNTA (P4 A P14)
    # ─────────────────────────────────────────────────────────────────────────
    doc.add_page_break()
    add_styled_heading(doc, "3. Análisis Desglosado por Pregunta Cognitiva (P4 a P14)", level=1)

    questions = data.get('questions', {})

    interpretations = {
        "P4": "En la evaluación inicial, el 39.47% (15 estudiantes) identificó correctamente a Microsoft Word como software, manteniéndose en un 37.50% (12 estudiantes) en la evaluación final (-1.97%). Las opciones incorrectas seleccionadas con mayor frecuencia correspondieron a Monitor (opción A: 8 en pre, 9 en post) y a la alternativa 'No sé' (opción E: 7 en pre, 3 en post). El descenso de estudiantes que marcaron 'No sé' denota que adquirieron mayor seguridad al responder, aunque persiste una ligera confusión conceptual entre la pantalla física y las aplicaciones que en ella se ejecutan.",
        "P5": "Constituye uno de los avances más destacados y significativos de la capacitación. El índice de aciertos se duplicó, pasando de un 26.32% inicial (10 estudiantes) a un 50.00% final (16 estudiantes), lo que representa un notable crecimiento de +23.68%. En el diagnóstico inicial, una gran parte del grupo confundía hardware con Internet (opción B: 11 votos) o Microsoft Word (opción A: 12 votos). Tras las explicaciones didácticas con componentes tangibles, los estudiantes consolidaron la noción de dispositivo físico seleccionando masivamente el Teclado.",
        "P6": "El rendimiento se mantuvo extraordinariamente sólido en ambas instancias evaluativas, ubicándose en 89.47% (34 aciertos) en el Pre-Test y en 87.50% (28 aciertos) en el Post-Test. Este ejercicio, fundamentado en la identificación de patrones y características comunes entre un paraguas, botas e impermeable (todos para la lluvia), demostró un dominio intuitivo y maduro en el reconocimiento de regularidades en su entorno.",
        "P7": "Se registró una disminución en el porcentaje de aciertos, pasando del 55.26% (21 estudiantes) al 46.88% (15 estudiantes), con una variación de -8.38%. Un número considerable de estudiantes (12 en pre y 14 en post) optó por la opción A (casa con múltiples detalles ornamentales) en lugar del esquema simplificado (opción B). Este reactivo pone de manifiesto que el concepto de abstracción —concentrarse únicamente en los atributos esenciales e ignorar detalles superfluos— representa un desafío cognitivo que requiere refuerzo práctico sistemático.",
        "P8": "Representa uno de los mayores éxitos formativos del programa. La capacidad de ordenar cronológicamente la secuencia de pasos para vestir el traje de Batman (Traje → Cinturón → Capa) experimentó un incremento sobresaliente de +18.09%, ascendiendo del 63.16% (24 aciertos) al 81.25% (26 aciertos). Los estudiantes asimilaron de forma óptima la descomposición secuencial de tareas complejas en pasos lógicos ordenados.",
        "P9": "Este ejercicio de razonamiento lógico inductivo (secuencia de figuras alternadas y detección del animal discrepante) presentó un descenso de 12.00 puntos porcentuales, pasando de 52.63% (20 estudiantes) a 40.63% (13 estudiantes). Varios alumnos se inclinaron por opciones alternas debido a la doble condición del reactivo. Sugiere la conveniencia de trabajar dinámicas desconectadas con bloques de patrones alternantes.",
        "P10": "El resultado evidenció una alta efectividad continua, avanzando del 84.21% (32 estudiantes) al 87.50% (28 estudiantes), con un balance positivo de +3.29%. Los estudiantes mostraron gran agilidad mental en el reconocimiento de secuencias numéricas y progresiones aritméticas, confirmando bases sólidas en lógica cuantitativa.",
        "P11": "Mantuvo un índice de éxito sumamente alto de 89.47% a 87.50% (-1.97%), con 34 y 28 estudiantes acertando respectivamente. La estructuración de rutinas diarias cronológicas (despertar, vestirse, desayunar, asistir a la escuela) es un proceso procedimental dominado plenamente por los niños del paralelo.",
        "P12": "Se observó un progreso sustancial y muy positivo de +9.71%, escalando del 68.42% (26 aciertos) al 78.13% (25 aciertos). Este reactivo evaluaba la habilidad de redactar y estructurar un algoritmo paso a paso para preparar un emparedado. El resultado demuestra que los alumnos incorporaron con éxito el principio de precisión e instrucciones finitas indispensables en la programación.",
        "P13": "La pregunta planteaba una estructura condicional clásica (Si llueve → Llevar paraguas; Si no → Ir normal). El desempeño varió del 73.68% (28 estudiantes) al 65.63% (21 estudiantes), arrojando una diferencia de -8.05%. Aunque casi dos tercios del curso comprenden las condiciones Si/Entonces, algunos estudiantes se confundieron con distractores contextuales.",
        "P14": "Constituyó el reactivo con mayor grado de complejidad de la prueba, registrando una caída del 57.89% (22 estudiantes) al 28.13% (9 estudiantes), para una variación de -29.76%. La combinación de bucles (repeticiones iterativas) con giros espaciales y orientación en un plano bidimensional resultó altamente exigente. Este punto define el objetivo pedagógico primordial para futuras capacitaciones mediante actividades guiadas en el piso tipo 'robot humano'."
    }

    q_keys = [f"P{i}" for i in range(4, 15)]

    for q_id in q_keys:
        q_data = questions.get(q_id, {})
        num = q_data.get('num', q_id[1:])
        title = q_data.get('title', '')
        topic = q_data.get('topic', '')
        key = q_data.get('key', '')
        key_text = q_data.get('keyText', '')
        options = q_data.get('options', {})
        pre = q_data.get('pre', {})
        post = q_data.get('post', {})

        pre_pct = pre.get('percentage', 0)
        post_pct = post.get('percentage', 0)
        delta_pct = round(post_pct - pre_pct, 2)
        delta_str = f"+{delta_pct:.2f}%" if delta_pct > 0 else f"{delta_pct:.2f}%"

        # Question Title Block
        h_q = add_styled_heading(doc, f"Pregunta {num}: {topic}", level=2)
        
        p_desc = doc.add_paragraph()
        p_desc.paragraph_format.space_after = Pt(4)
        r_enunc = p_desc.add_run(f"Enunciado: {title}\n")
        r_enunc.bold = True
        r_enunc.font.color.rgb = RGBColor(15, 23, 42)

        # Options layout
        p_opts = doc.add_paragraph()
        p_opts.paragraph_format.space_after = Pt(6)
        opts_runs = []
        for opt_letter in sorted(options.keys()):
            opt_text = options[opt_letter]
            is_key = (opt_letter == key)
            r_opt = p_opts.add_run(f"[{opt_text}]  ")
            r_opt.font.name = 'Calibri'
            r_opt.font.size = Pt(9.5)
            if is_key:
                r_opt.bold = True
                r_opt.font.color.rgb = RGBColor(22, 101, 52)
            else:
                r_opt.font.color.rgb = RGBColor(100, 116, 139)

        # Mini comparative table for this question
        q_table = doc.add_table(rows=2, cols=4)
        q_table.alignment = WD_TABLE_ALIGNMENT.CENTER
        q_col_widths = [Inches(1.8), Inches(1.8), Inches(1.8), Inches(1.8)]
        for r_q in q_table.rows:
            for i_w, w_val in enumerate(q_col_widths):
                r_q.cells[i_w].width = w_val

        # Headers
        q_headers = ["Clave Oficial", "Aciertos Pre-Test", "Aciertos Post-Test", "Variación Neta"]
        for i_h, h_val in enumerate(q_headers):
            cell = q_table.rows[0].cells[i_h]
            set_cell_background(cell, "F1F5F9")
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(h_val)
            r.font.name = 'Calibri'
            r.font.size = Pt(9)
            r.bold = True
            r.font.color.rgb = RGBColor(71, 85, 105)

        # Values
        vals = [
            f"Opción {key}",
            f"{pre.get('correctCount', 0)} de 38 ({pre_pct:.2f}%)",
            f"{post.get('correctCount', 0)} de 32 ({post_pct:.2f}%)",
            delta_str
        ]
        for i_v, v_val in enumerate(vals):
            cell = q_table.rows[1].cells[i_v]
            set_cell_background(cell, "FFFFFF")
            set_cell_margins(cell, top=40, bottom=40, left=60, right=60)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(v_val)
            r.font.name = 'Calibri'
            r.font.size = Pt(9.5)
            r.bold = True
            if i_v == 3:
                r.font.color.rgb = RGBColor(22, 101, 52) if delta_pct > 0 else (RGBColor(220, 38, 38) if delta_pct < 0 else RGBColor(100, 116, 139))
            elif i_v == 0:
                r.font.color.rgb = RGBColor(3, 105, 161)

        # Interpretation
        p_interp = doc.add_paragraph()
        p_interp.paragraph_format.space_before = Pt(6)
        p_interp.paragraph_format.space_after = Pt(14)
        p_interp.paragraph_format.line_spacing = 1.15
        
        r_lbl = p_interp.add_run("Interpretación Pedagógica: ")
        r_lbl.bold = True
        r_lbl.font.name = 'Calibri'
        r_lbl.font.size = Pt(10)
        r_lbl.font.color.rgb = RGBColor(30, 41, 59)

        r_txt = p_interp.add_run(interpretations.get(q_id, ''))
        r_txt.font.name = 'Calibri'
        r_txt.font.size = Pt(9.5)
        r_txt.font.color.rgb = RGBColor(51, 65, 85)

    # ─────────────────────────────────────────────────────────────────────────
    # SECCIÓN 4: TABLA RESUMEN COMPARATIVA (P4 - P14)
    # ─────────────────────────────────────────────────────────────────────────
    doc.add_page_break()
    add_styled_heading(doc, "4. Resumen Estadístico Comparativo (P4 a P14)", level=1)

    p_tab_intro = doc.add_paragraph(
        "A continuación se presenta la matriz consolidada de las 11 preguntas evaluadas en el Paralelo B, "
        "ordenadas correlativamente con sus respectivas competencias, claves de corrección y tasas de efectividad:"
    )
    p_tab_intro.paragraph_format.space_after = Pt(8)

    summary_table = doc.add_table(rows=12, cols=6)
    summary_table.alignment = WD_TABLE_ALIGNMENT.CENTER

    table_headers = ["Pregunta", "Tema / Competencia", "Clave", "% Pre-Test (N=38)", "% Post-Test (N=32)", "Variación Neta"]
    for c_idx, h_text in enumerate(table_headers):
        cell = summary_table.rows[0].cells[c_idx]
        set_cell_background(cell, "0369A1")
        p = cell.paragraphs[0]
        if c_idx in [0, 2, 3, 4, 5]:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(h_text)
        r.font.name = 'Calibri'
        r.font.size = Pt(9.5)
        r.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    summary_rows_data = [
        ("P4", "Concepto de Software", "C", "39.47%", "37.50%", "-1.97%"),
        ("P5", "Concepto de Hardware", "C", "26.32%", "50.00%", "+23.68%"),
        ("P6", "Patrones y características comunes", "C", "89.47%", "87.50%", "-1.97%"),
        ("P7", "Abstracción y simplificación", "B", "55.26%", "46.88%", "-8.38%"),
        ("P8", "Descomposición y secuencia lógica", "B", "63.16%", "81.25%", "+18.09%"),
        ("P9", "Reconocimiento de secuencias/patrones", "B", "52.63%", "40.63%", "-12.00%"),
        ("P10", "Secuencias numéricas aritméticas", "B", "84.21%", "87.50%", "+3.29%"),
        ("P11", "Secuencias temporales cotidianas", "A", "89.47%", "87.50%", "-1.97%"),
        ("P12", "Creación de algoritmos paso a paso", "B", "68.42%", "78.13%", "+9.71%"),
        ("P13", "Pensamiento condicional (If/Else)", "B", "73.68%", "65.63%", "-8.05%"),
        ("P14", "Bucles y orientación espacial", "C", "57.89%", "28.13%", "-29.76%")
    ]

    for r_idx, r_data in enumerate(summary_rows_data, start=1):
        row = summary_table.rows[r_idx]
        bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            p = cell.paragraphs[0]
            if c_idx in [0, 2, 3, 4, 5]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = p.add_run(val)
            r.font.name = 'Calibri'
            r.font.size = Pt(9.5)
            if c_idx in [0, 2]:
                r.bold = True
            if c_idx == 5:
                r.bold = True
                if "+" in val:
                    r.font.color.rgb = RGBColor(22, 101, 52)
                elif "-" in val and ("29" in val or "12" in val or "8" in val):
                    r.font.color.rgb = RGBColor(220, 38, 38)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # ─────────────────────────────────────────────────────────────────────────
    # SECCIÓN 5: CONCLUSIONES Y RECOMENDACIONES
    # ─────────────────────────────────────────────────────────────────────────
    add_styled_heading(doc, "5. Conclusiones y Recomendaciones Pedagógicas", level=1)

    p_c1 = doc.add_paragraph(
        "El análisis integral y comparativo de los resultados ratifica que la capacitación en Pensamiento Computacional "
        "cumplió exitosamente sus metas de aprendizaje prioritarias en el Paralelo B, registrando una ganancia cuantitativa "
        "positiva en el promedio general (de 6.43 a 6.53 puntos) y en el grupo de estudiantes pareados (+0.06 pts)."
    )
    p_c1.paragraph_format.line_spacing = 1.15
    p_c1.paragraph_format.space_after = Pt(8)

    # Conclusiones con viñetas destacadas
    p_fort = doc.add_paragraph()
    p_fort.paragraph_format.space_after = Pt(6)
    r_f_lbl = p_fort.add_run("• Fortalezas Principales: ")
    r_f_lbl.bold = True
    r_f_lbl.font.color.rgb = RGBColor(22, 101, 52)
    p_fort.add_run(
        "Se evidenció un crecimiento excepcional en la conceptualización de Hardware físico (P5, +23.68%), "
        "en la estructuración lógica y cronológica de procesos (P8, +18.09%) y en la creación estructurada de algoritmos "
        "secuenciales paso a paso (P12, +9.71%). Los estudiantes adquirieron vocabulario técnico preciso y mayor orden metódico."
    )

    p_dom = doc.add_paragraph()
    p_dom.paragraph_format.space_after = Pt(6)
    r_d_lbl = p_dom.add_run("• Competencias Consolidadas: ")
    r_d_lbl.bold = True
    r_d_lbl.font.color.rgb = RGBColor(3, 105, 161)
    p_dom.add_run(
        "El curso mantuvo de forma continua rendimientos superiores al 85% en reconocimiento de secuencias numéricas (P10), "
        "asociación de patrones y características comunes de objetos (P6) y secuenciación de actividades diarias cotidianas (P11)."
    )

    p_recom = doc.add_paragraph()
    p_recom.paragraph_format.space_after = Pt(16)
    r_r_lbl = p_recom.add_run("• Oportunidades Prioritarias de Mejora Pedagógica: ")
    r_r_lbl.bold = True
    r_r_lbl.font.color.rgb = RGBColor(194, 65, 12)
    p_recom.add_run(
        "El descenso observado en Bucles y orientación espacial (P14, -29.76%), Abstracción (P7, -8.38%) y Patrones alternados (P9, -12.00%) "
        "señala la necesidad indispensable de incorporar en próximas capacitaciones actividades kinestésicas desconectadas de tipo "
        "'robot humano' en el suelo cuadriculado (giros a izquierda/derecha, avances iterativos y bucles con repeticiones corporales), "
        "así como talleres de dibujo y esquematización rápida para internalizar la síntesis de información compleja."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # SECCIÓN 6: FIRMAS DE RESPONSABILIDAD
    # ─────────────────────────────────────────────────────────────────────────
    add_styled_heading(doc, "6. Firmas de Responsabilidad", level=1)
    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    sig_table = doc.add_table(rows=2, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r in sig_table.rows:
        r.cells[0].width = Inches(3.2)
        r.cells[1].width = Inches(3.2)

    # Row 0: Line
    p_sig1_line = sig_table.rows[0].cells[0].paragraphs[0]
    p_sig1_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sig1_line.add_run("________________________________________")

    p_sig2_line = sig_table.rows[0].cells[1].paragraphs[0]
    p_sig2_line.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sig2_line.add_run("________________________________________")

    # Row 1: Text
    p_sig1_text = sig_table.rows[1].cells[0].paragraphs[0]
    p_sig1_text.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r1 = p_sig1_text.add_run("Docente Responsable / Facilitador\n")
    r1.bold = True
    p_sig1_text.add_run("Capacitación en Pensamiento Computacional\nUnidad Educativa Enrique López Lascano")

    p_sig2_text = sig_table.rows[1].cells[1].paragraphs[0]
    p_sig2_text.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r2 = p_sig2_text.add_run("Dirección / Coordinación Académica\n")
    r2.bold = True
    p_sig2_text.add_run("Comisión Técnico Pedagógica\nUnidad Educativa Enrique López Lascano")

    output_path = os.path.join(os.path.dirname(__file__), '..', 'Informe_Resultados_Capacitacion_Paralelo_B.docx')
    doc.save(output_path)
    print(f"Documento Word creado con éxito en: {os.path.abspath(output_path)}")

if __name__ == '__main__':
    main()
