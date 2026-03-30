import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SensorInstallation } from '../data/mockData';
import { Equipment, SensorInstallationDB } from '../api/lib/supabase';

export const generateInstallationReportPDF = (installation: SensorInstallation) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport d\'Installation de Capteur', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations Générales', margin, yPosition);



  yPosition += 10;
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Nom du capteur', installation.sensorName],
      ['Équipement', installation.equipmentName],
      ['Référence équipement', installation.equipmentReference],
      ['Date d\'installation', new Date(installation.installationDate).toLocaleDateString('fr-FR')],
      ['Emplacement', installation.installationLocation],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    }
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Spécifications Techniques', margin, yPosition);

  yPosition += 10;
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Type de capteur', installation.sensorType],
      ['Type de mesure', installation.measurementType],
      ['Fabricant', installation.manufacturer],
      ['Numéro de série', installation.serialNumber],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    }
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Calibration', margin, yPosition);

  yPosition += 10;
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Date de calibration', new Date(installation.calibrationDate).toLocaleDateString('fr-FR')],
      ['Prochaine calibration', new Date(installation.nextCalibrationDate).toLocaleDateString('fr-FR')],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    }
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations d\'Installation', margin, yPosition);

  yPosition += 10;
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Installé par', installation.installedBy],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    }
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  if (installation.notes) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', margin, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(installation.notes, pageWidth - 2 * margin);
    doc.text(splitNotes, margin, yPosition);
  }

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Document généré automatiquement par le système de gestion de capteurs',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  const fileName = `Installation_${installation.equipmentReference}_${installation.sensorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateBulkInstallationReportPDF = (installations: SensorInstallation[]) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport d\'Installation - Ensemble des Capteurs', pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(`Nombre de capteurs: ${installations.length}`, pageWidth / 2, yPosition + 5, { align: 'center' });

  yPosition += 20;

  const tableData = installations.map(inst => [
    inst.sensorName,
    inst.equipmentReference,
    inst.sensorType,
    new Date(inst.installationDate).toLocaleDateString('fr-FR'),
    inst.installedBy,
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Capteur', 'Équipement', 'Type', 'Date Installation', 'Installé par']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 35 },
      2: { cellWidth: 45 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 }
    }
  });

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Document généré automatiquement par le système de gestion de capteurs',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  const fileName = `Installation_Report_All_Sensors_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// Generate PDF report for equipment sensors
export const generateEquipmentSensorsReportPDF = (
  equipment: Equipment,
  sensors: SensorInstallationDB[]
) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("Rapport d'Équipement et Capteurs", pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date de génération: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });

  yPosition += 15;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("Informations de l'Équipement", margin, yPosition);

  yPosition += 10;
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Nom', equipment.name || 'N/A'],
      ['Référence', equipment.reference || 'N/A'],
      ['Type', equipment.type || 'N/A'],
      ['Fabricant', equipment.manufacturer || 'N/A'],
      ['Modèle', equipment.model || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    }
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Capteurs Installés', margin, yPosition);

  yPosition += 10;

  const sensorTableData = sensors.map(sensor => [
    sensor.sensor_name,
    sensor.installation_point,
    sensor.is_active ? 'Actif' : 'Inactif',
    sensor.status || 'N/A'
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Nom du Capteur', 'Point d\'Installation', 'État', 'Statut']],
    body: sensorTableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], fontSize: 10, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 }
    }
  });

  yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

  // Summary
  const activeSensors = sensors.filter(s => s.is_active).length;
  const totalSensors = sensors.length;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé', margin, yPosition);

  yPosition += 10;
  autoTable(doc, {
    startY: yPosition,
    head: [],
    body: [
      ['Total des capteurs', String(totalSensors)],
      ['Capteurs actifs', String(activeSensors)],
      ['Capteurs inactifs', String(totalSensors - activeSensors)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [39, 174, 96] },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 'auto' }
    }
  });

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(
    'Document généré automatiquement par le système de gestion de capteurs',
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );

  const fileName = `Equipment_Report_${equipment.reference || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
