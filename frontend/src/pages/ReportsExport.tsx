import React, { useRef } from 'react';
import {
  FileText,
  Download,
  BarChart3,
  AlertTriangle,
  Gauge,
  Clock,
  Activity,
  Factory,
  ThermometerSun,
  Vibrate,
  Waves,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../components/assets/styles/animation.css';

const ReportsExport = () => {
  const criticalMachinesRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  const criticalMachines = [
    {
      name: "BATIMENT PRODUCTION SP2",
      status: "Opérationnel",
      lastMaintenance: "2025-03-15",
      nextMaintenance: "2025-04-15",
      alerts: 2,
      type: "Monter/Descente",
      component: "TRANCHE URGENTE PHASE 1",
    },
    {
      name: "STATION DE POMPAGE 2",
      status: "Maintenance",
      lastMaintenance: "2025-03-10",
      nextMaintenance: "2025-04-10",
      alerts: 3,
      type: "Pompage",
      component: "SYSTEME DE MOTORISATION",
    },
    {
      name: "SYSTEME DE MOTORISATION",
      status: "Critique",
      lastMaintenance: "2025-03-05",
      nextMaintenance: "2025-04-05",
      alerts: 5,
      type: "Motorisation",
      component: "ARMOIRES AUTOMATICITE",
    },
  ];

  const recentAlerts = [
    {
      type: 'critical',
      message: 'Température élevée - Station de Pompage 2',
      time: '2025-03-20 14:30',
      icon: ThermometerSun,
    },
    {
      type: 'warning',
      message: 'Vibration anormale - Système de Motorisation',
      time: '2025-03-20 14:25',
      icon: Vibrate,
    },
    {
      type: 'info',
      message: 'Pression stable - Bâtiment Production SP2',
      time: '2025-03-20 14:20',
      icon: Waves,
    },
  ];

  const reports = [
    {
      title: "Rapport des Machines Critiques",
      description: "Export PDF des états et alertes des machines critiques",
      icon: AlertTriangle,
      type: "pdf",
      color: "text-red-500",
      bgColor: "bg-red-50",
      ref: criticalMachinesRef,
    },
    {
      title: "Journal des Alertes",
      description: "Historique complet des alertes système",
      icon: FileText,
      type: "pdf",
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      ref: alertsRef,
    },
    {
      title: "Rapport de Performance",
      description: "Analyse détaillée des KPIs (TRG, MTBF)",
      icon: Activity,
      type: "powerbi",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Analyse par Zone",
      description: "Répartition des incidents par zone",
      icon: Factory,
      type: "powerbi",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
  ];

  const kpis = [
    {
      title: "Disponibilité",
      value: "94.5%",
      icon: Activity,
      color: "text-green-500",
    },
    {
      title: "TRG",
      value: "87.2%",
      icon: Gauge,
      color: "text-blue-500",
    },
    {
      title: "MTBF",
      value: "168h",
      icon: Clock,
      color: "text-purple-500",
    },
    {
      title: "Taux d'Alertes",
      value: "2.3%",
      icon: AlertTriangle,
      color: "text-red-500",
    },
  ];

  const generatePDF = async (type: string, title: string, contentRef: React.RefObject<HTMLDivElement>) => {
    if (!contentRef.current) {
      console.error("Content reference is null");
      return;
    }
  
    try {
      console.log("Starting PDF generation...");
      
      // Créer un clone du contenu pour éviter les problèmes de style
      const content = contentRef.current.cloneNode(true) as HTMLElement;
      
      // Appliquer des styles spécifiques pour le PDF
      content.style.width = '210mm';
      content.style.padding = '20px';
      content.style.background = 'white';
      
      // Créer un conteneur temporaire
      const container = document.createElement('div');
      container.appendChild(content);
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);
      
      const canvas = await html2canvas(content, {
        // Removed 'scale' as it is not a valid option for html2canvas
        logging: true,
        useCORS: true,
        allowTaint: true,
       
        // Removed invalid 'windowWidth' property
        
      });
      
      document.body.removeChild(container);
      
      console.log("Canvas generated successfully");
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${title.toLowerCase().replace(/ /g, '_')}.pdf`);
      console.log("PDF saved successfully");
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please check console for details.');
    }
  };

  const handleExport = (type: string, title: string, ref?: React.RefObject<HTMLDivElement>) => {
    if (type === 'pdf' && ref) {
      generatePDF(type, title, ref);
    } else if (type === 'powerbi') {
      alert(`PowerBI report: ${title}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Documents & Rapports</h1>
        <div className="text-sm text-gray-500">
          Dernière mise à jour: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Hidden PDF Content */}
      <div className="hidden">
        <div ref={criticalMachinesRef} className="p-8 bg-white" style={{ width: '210mm' }}>
          <h2 className="text-2xl font-bold mb-6">Rapport des Machines Critiques</h2>
          <div className="space-y-6">
            {criticalMachines.map((machine, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{machine.name}</h3>
                    <p className="text-sm text-gray-600">{machine.component}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    machine.status === 'Opérationnel' ? 'bg-green-100 text-green-800' :
                    machine.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {machine.status}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Dernière maintenance</p>
                    <p className="font-medium">{machine.lastMaintenance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Prochaine maintenance</p>
                    <p className="font-medium">{machine.nextMaintenance}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{machine.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Alertes actives</p>
                    <p className="font-medium text-red-600">{machine.alerts}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div ref={alertsRef} className="p-8 bg-white" style={{ width: '210mm' }}>
          <h2 className="text-2xl font-bold mb-6">Journal des Alertes</h2>
          <div className="space-y-4">
            {recentAlerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  alert.type === 'critical' ? 'bg-red-50' :
                  alert.type === 'warning' ? 'bg-yellow-50' :
                  'bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <alert.icon
                      className={`w-5 h-5 ${
                        alert.type === 'critical' ? 'text-red-500' :
                        alert.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600">{alert.time}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {alert.type.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
              </div>
              <kpi.icon className={`w-8 h-8 ${kpi.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Exports PDF</h2>
          </div>
          <div className="space-y-4">
            {reports.filter(r => r.type === "pdf").map((report, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${report.bgColor} cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => handleExport("pdf", report.title, report.ref)}
              >
                <div className="flex items-center space-x-3">
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                  <div>
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="text-sm text-gray-600">{report.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Rapports PowerBI</h2>
          </div>
          <div className="space-y-4">
            {reports.filter(r => r.type === "powerbi").map((report, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${report.bgColor} cursor-pointer hover:opacity-90 transition-opacity`}
                onClick={() => handleExport("powerbi", report.title)}
              >
                <div className="flex items-center space-x-3">
                  <report.icon className={`w-6 h-6 ${report.color}`} />
                  <div>
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="text-sm text-gray-600">{report.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PowerBI Embed Preview */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Aperçu PowerBI</h2>
        </div>
        <div className="aspect-video bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Sélectionnez un rapport PowerBI pour afficher l'aperçu</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsExport;