// Temporary ambient declaration for jspdf-autotable
// Install proper types with `npm install --save-dev @types/jspdf-autotable` when available

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  interface AutoTableOptions {
    startY?: number;
    head?: any[];
    body?: any[];
    theme?: string;
    headStyles?: object;
    styles?: object;
    columnStyles?: object;
    [key: string]: any;
  }
  export default function autoTable(doc: jsPDF, options: AutoTableOptions): jsPDF;
}
