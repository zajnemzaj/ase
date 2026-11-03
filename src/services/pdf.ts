import { jsPDF } from 'jspdf';
import fontUrl from '@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf?url';

import { faceRings } from '@/simulation/targetFace';

export interface PdfFace {
  name: string;
  score: number;
  // Radius in mm, printed at real size
  radius: number;
  calculated: boolean;
  // Arrow shaft in mm when line cutters were counted
  arrowDiameter: number | null;
}

export interface PdfLabels {
  name: string;
  score: string;
  diameter: string;
  arrowDiameter: string;
  calculated: string;
  enteredByUser: string;
}

// Same place as the legacy PDF: a 200 mm square under the text on A4
const FACE_BOX = { x: 5, y: 49, size: 200 };

let fontBase64: Promise<string> | undefined;

// The standard PDF fonts can't print Hungarian ő and ű, so Roboto is embedded
function loadFont(): Promise<string> {
  fontBase64 ??= fetch(fontUrl)
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return btoa(binary);
    });
  return fontBase64;
}

function drawFace(doc: jsPDF, radius: number) {
  const cx = FACE_BOX.x + FACE_BOX.size / 2;
  const cy = FACE_BOX.y + FACE_BOX.size / 2;
  // Faces bigger than the box are cut at its edges, as before
  doc.saveGraphicsState();
  doc.rect(FACE_BOX.x, FACE_BOX.y, FACE_BOX.size, FACE_BOX.size, null);
  doc.clip();
  doc.discardPath();
  doc.setLineWidth(Math.max(0.1, radius / 400));
  for (const ring of faceRings(radius)) {
    doc.setFillColor(ring.fill);
    doc.setDrawColor(ring.stroke);
    doc.circle(cx, cy, ring.radius, 'FD');
  }
  const cross = radius / 100;
  doc.setDrawColor('#000000');
  doc.line(cx - cross, cy, cx + cross, cy);
  doc.line(cx, cy - cross, cx, cy + cross);
  doc.restoreGraphicsState();
}

/**
 * A4 PDF with one target face per page at real size
 */
export async function createFacesPdf(faces: PdfFace[], labels: PdfLabels): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.addFileToVFS('Roboto-Regular.ttf', await loadFont());
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.setFont('Roboto', 'normal');

  faces.forEach((face, i) => {
    if (i > 0) doc.addPage();
    doc.setFontSize(9);
    doc.setTextColor('#000000');
    doc.text(`${labels.name}: ${face.name}`, 10, 10);
    doc.text(`${labels.score}: ${face.score}`, 10, 15);
    const how = face.calculated ? labels.calculated : labels.enteredByUser;
    doc.text(`${labels.diameter}: ${face.radius * 2} mm (${how})`, 10, 20);
    if (face.arrowDiameter !== null) {
      doc.text(`${labels.arrowDiameter}: ${face.arrowDiameter} mm`, 10, 25);
    }
    drawFace(doc, face.radius);
  });
  return doc;
}

/**
 * Downloads the PDF. A Capacitor build will need its own way to save it.
 */
export function savePdf(doc: jsPDF, fileName: string) {
  doc.save(fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`);
}
