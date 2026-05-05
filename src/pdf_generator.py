from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from datetime import datetime

def generate_pdf_report(parsed_data, output_path="/tmp/clinical_report.pdf"):
    """
    Generates a professional tabular PDF report with one row per drug.
    """
    try:
        doc = SimpleDocTemplate(
            output_path, 
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=1*inch,
            bottomMargin=0.75*inch
        )
        elements = []
        styles = getSampleStyleSheet()

        # ── Custom Styles ─────────────────────────────────────
        title_style = ParagraphStyle(
            'Title', parent=styles['Normal'],
            fontSize=28, fontName='Helvetica-Bold',
            textColor=colors.HexColor("#6366f1"),
            leading=32,
            spaceAfter=12
        )
        subtitle_style = ParagraphStyle(
            'Subtitle', parent=styles['Normal'],
            fontSize=12, textColor=colors.HexColor("#64748b"),
            leading=14,
            spaceAfter=25
        )
        section_style = ParagraphStyle(
            'Section', parent=styles['Normal'],
            fontSize=13, fontName='Helvetica-Bold',
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=20, spaceAfter=8
        )
        footer_style = ParagraphStyle(
            'Footer', parent=styles['Normal'],
            fontSize=9, textColor=colors.HexColor("#94a3b8"),
            spaceAfter=4
        )
        cell_style = ParagraphStyle(
            'Cell', parent=styles['Normal'],
            fontSize=11, leading=14
        )

        # ── Header ────────────────────────────────────────────
        elements.append(Paragraph("🩺 RxLens", title_style))
        elements.append(Paragraph("AI-Powered Clinical Prescription Report", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#6366f1")))
        elements.append(Spacer(1, 16))

        # ── Report Metadata ───────────────────────────────────
        now = datetime.now().strftime("%d %B %Y, %I:%M %p")
        meta_data = [
            ['Report Generated:', now],
            ['AI Engine:', 'Google Gemini 2.0 Flash (Vision Language Model)'],
            ['Report Type:', 'Prescription Digitization & Clinical Safety Report'],
        ]
        meta_table = Table(meta_data, colWidths=[2*inch, 4.5*inch])
        meta_table.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('TEXTCOLOR', (0,0), (0,-1), colors.HexColor("#6366f1")),
            ('TEXTCOLOR', (1,0), (1,-1), colors.HexColor("#1e293b")),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 20))

        # ── Medication Table ──────────────────────────────────
        elements.append(Paragraph("Prescribed Medication Regimen", section_style))

        # Parse comma-separated fields into individual drug rows
        drugs = [d.strip().title() for d in parsed_data.get("drug", "N/A").split(",") if d.strip()]
        dosages = [d.strip() for d in parsed_data.get("dosage", "N/A").split(",")]
        frequencies = [f.strip().title() for f in parsed_data.get("frequency", "N/A").split(",")]
        durations = [d.strip() for d in parsed_data.get("duration", "N/A").split(",")]

        # Build table header
        table_data = [['#', 'Drug / Medication', 'Dosage', 'Frequency', 'Duration']]

        # One row per drug
        for i, drug in enumerate(drugs):
            table_data.append([
                str(i + 1),
                Paragraph(drug, cell_style),
                dosages[i] if i < len(dosages) else dosages[-1] if dosages else "N/A",
                frequencies[i] if i < len(frequencies) else frequencies[-1] if frequencies else "N/A",
                durations[i] if i < len(durations) else durations[-1] if durations else "N/A",
            ])

        med_table = Table(table_data, colWidths=[0.4*inch, 2.1*inch, 1.1*inch, 1.5*inch, 1.4*inch])
        med_table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#6366f1")),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 11),
            ('ALIGN', (0,0), (-1,0), 'CENTER'),
            ('BOTTOMPADDING', (0,0), (-1,0), 10),
            ('TOPPADDING', (0,0), (-1,0), 10),
            # Data rows
            ('FONTSIZE', (0,1), (-1,-1), 10),
            ('ALIGN', (0,1), (0,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,1), (-1,-1), 9),
            ('BOTTOMPADDING', (0,1), (-1,-1), 9),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            # Alternating row colors
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white]),
            # Grid
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#6366f1")),
            ('ROUNDEDCORNERS', [4]),
        ]))
        elements.append(med_table)
        elements.append(Spacer(1, 24))

        # ── Clinical Summary ──────────────────────────────────
        if parsed_data.get("summary"):
            elements.append(Paragraph("Clinical Summary", section_style))
            summary_data = [['', parsed_data["summary"]]]
            sum_table = Table(summary_data, colWidths=[0.1*inch, 6.4*inch])
            sum_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eef2ff")),
                ('FONTSIZE', (0,0), (-1,-1), 10),
                ('TOPPADDING', (0,0), (-1,-1), 12),
                ('BOTTOMPADDING', (0,0), (-1,-1), 12),
                ('LEFTPADDING', (1,0), (1,-1), 12),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#6366f1")),
                ('LINEAFTER', (0,0), (0,-1), 3, colors.HexColor("#6366f1")),
            ]))
            elements.append(sum_table)
            elements.append(Spacer(1, 24))

        # ── Footer ────────────────────────────────────────────
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0")))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("⚕ This report was automatically generated by RxLens Clinical Intelligence using Google Gemini Vision AI.", footer_style))
        elements.append(Paragraph("DISCLAIMER: Always verify prescription details with a licensed healthcare professional before administering any medication.", footer_style))

        doc.build(elements)
        return output_path

    except Exception as e:
        print(f"PDF Generation Error: {e}")
        return None
