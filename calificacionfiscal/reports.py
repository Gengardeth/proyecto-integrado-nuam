"""
Módulo para generar reportes y exportaciones de TaxRatings.
"""
import csv
from io import BytesIO, StringIO
from datetime import datetime
from django.http import HttpResponse
from django.db.models import Count, Q
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from calificacionfiscal.models import TaxRating


def generar_reporte_csv(queryset, filename='reporte_tax_ratings.csv'):
    """
    Genera un archivo CSV con los TaxRatings del queryset.
    
    Args:
        queryset: QuerySet de TaxRating
        filename: Nombre del archivo CSV
        
    Returns:
        HttpResponse con el archivo CSV
    """
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    response.write('\ufeff')  # BOM para UTF-8
    
    writer = csv.writer(response)
    
    # Headers
    writer.writerow([
        'ID', 'Issuer', 'Instrument', 'Rating', 'Fecha Rating', 
        'Fecha Vencimiento', 'Outlook', 'Analista', 'Activo', 'Creado En'
    ])
    
    # Datos
    for obj in queryset:
        writer.writerow([
            obj.id,
            obj.issuer.nombre,
            obj.instrument.nombre,
            obj.rating,
            obj.fecha_rating.strftime('%Y-%m-%d'),
            obj.fecha_vencimiento.strftime('%Y-%m-%d') if obj.fecha_vencimiento else '',
            obj.outlook,
            obj.analista.username if obj.analista else '',
            'Sí' if obj.activo else 'No',
            obj.creado_en.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    return response


def generar_reporte_pdf(queryset, filename='reporte_tax_ratings.pdf', incluir_estadisticas=True):
    """
    Genera un archivo PDF con los TaxRatings del queryset y opcionalmente estadísticas.
    
    Args:
        queryset: QuerySet de TaxRating
        filename: Nombre del archivo PDF
        incluir_estadisticas: Si incluir sección de estadísticas
        
    Returns:
        HttpResponse con el archivo PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=30, leftMargin=30, 
                            topMargin=30, bottomMargin=18)
    
    # Contenedor para elementos del PDF
    elements = []
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#2C3E50'),
        spaceAfter=12,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#34495E'),
        spaceAfter=8,
    )
    
    # Título
    elements.append(Paragraph('Reporte de Calificaciones Tributarias', title_style))
    elements.append(Spacer(1, 12))
    
    # Fecha de generación
    fecha_generacion = datetime.now().strftime('%d/%m/%Y %H:%M')
    elements.append(Paragraph(f'<b>Fecha de Generación:</b> {fecha_generacion}', styles['Normal']))
    elements.append(Paragraph(f'<b>Total de Registros:</b> {queryset.count()}', styles['Normal']))
    elements.append(Spacer(1, 20))
    
    # Estadísticas (si se solicitó)
    if incluir_estadisticas:
        elements.append(Paragraph('Estadísticas', heading_style))
        
        # Conteo por rating
        rating_stats = queryset.values('rating').annotate(count=Count('id')).order_by('-count')
        
        stats_data = [['Rating', 'Cantidad']]
        for stat in rating_stats:
            stats_data.append([stat['rating'], str(stat['count'])])
        
        stats_table = Table(stats_data, colWidths=[2*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498DB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(stats_table)
        elements.append(Spacer(1, 20))
    
    # Tabla de calificaciones
    elements.append(Paragraph('Detalle de Calificaciones', heading_style))
    elements.append(Spacer(1, 12))
    
    # Datos de la tabla
    data = [['Issuer', 'Instrument', 'Rating', 'Fecha', 'Outlook']]
    
    for obj in queryset[:50]:  # Limitar a 50 para no sobrecargar el PDF
        data.append([
            obj.issuer.nombre[:20],  # Truncar nombres largos
            obj.instrument.nombre[:20],
            obj.rating,
            obj.fecha_rating.strftime('%d/%m/%Y'),
            obj.outlook
        ])
    
    if queryset.count() > 50:
        data.append(['...', '...', '...', '...', '...'])
        elements.append(Paragraph(f'<i>Mostrando 50 de {queryset.count()} registros</i>', styles['Italic']))
        elements.append(Spacer(1, 8))
    
    # Crear tabla
    table = Table(data, colWidths=[1.5*inch, 1.5*inch, 0.8*inch, 1*inch, 0.8*inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2ECC71')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
    ]))
    
    elements.append(table)
    
    # Generar PDF
    doc.build(elements)
    
    # Preparar respuesta
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response


def obtener_estadisticas(queryset):
    """
    Genera estadísticas generales de un queryset de TaxRating.
    
    Args:
        queryset: QuerySet de TaxRating
        
    Returns:
        dict: Diccionario con estadísticas
    """
    total = queryset.count()
    activos = queryset.filter(activo=True).count()
    inactivos = queryset.filter(activo=False).count()
    
    # Por rating
    por_rating = {}
    rating_stats = queryset.values('rating').annotate(count=Count('id'))
    for stat in rating_stats:
        por_rating[stat['rating']] = stat['count']
    
    # Por outlook
    por_outlook = {}
    outlook_stats = queryset.values('outlook').annotate(count=Count('id'))
    for stat in outlook_stats:
        por_outlook[stat['outlook']] = stat['count']
    
    # Top issuers
    top_issuers = list(
        queryset.values('issuer__nombre')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    
    # Top instruments
    top_instruments = list(
        queryset.values('instrument__nombre')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    
    return {
        'total': total,
        'activos': activos,
        'inactivos': inactivos,
        'por_rating': por_rating,
        'por_outlook': por_outlook,
        'top_issuers': top_issuers,
        'top_instruments': top_instruments,
    }
