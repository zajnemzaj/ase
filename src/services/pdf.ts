import { jsPDF } from 'jspdf';
import fontUrl from '@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf?url';

import logoUrl from '@/assets/logo-ase-print.png?url';

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
  appTitle: string;
  name: string;
  score: string;
  diameter: string;
  arrowDiameter: string;
  calculated: string;
  enteredByUser: string;
}

// Same place as the legacy PDF: a 200 mm square under the text on A4
const FACE_BOX = { x: 5, y: 49, size: 200 };

// Printed under the name in the top right corner, the live site's address
const APP_ADDRESS = 'rebegin.ddns.net/ase';

// Logo, name and address on the top right, level with the face data on the left
const BRAND = { right: 200, top: 5, logoSize: 12, gap: 2 };

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

let logoBytes: Promise<Uint8Array> | undefined;

function loadLogo(): Promise<Uint8Array> {
  logoBytes ??= fetch(logoUrl)
    .then((response) => response.arrayBuffer())
    .then((buffer) => new Uint8Array(buffer));
  return logoBytes;
}

function drawBrand(doc: jsPDF, logo: Uint8Array, appTitle: string) {
  const logoX = BRAND.right - BRAND.logoSize;
  doc.addImage(logo, 'PNG', logoX, BRAND.top, BRAND.logoSize, BRAND.logoSize, 'logo');
  const textX = logoX - BRAND.gap;
  doc.setFontSize(12);
  doc.setTextColor('#10695c');
  doc.text(appTitle, textX, BRAND.top + 5, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor('#555555');
  const addressY = BRAND.top + 10;
  doc.text(APP_ADDRESS, textX, addressY, { align: 'right' });
  // Globe in front of the address, centered on its lowercase letters
  const globeRadius = 1.3;
  drawGlobe(
    doc,
    textX - doc.getTextWidth(APP_ADDRESS) - globeRadius - 1,
    addressY - 1,
    globeRadius,
  );
}

// A small line-drawn globe, the usual sign for a web address
function drawGlobe(doc: jsPDF, cx: number, cy: number, r: number) {
  doc.setDrawColor('#555555');
  doc.setLineWidth(0.15);
  doc.circle(cx, cy, r, 'S');
  doc.ellipse(cx, cy, r * 0.45, r, 'S');
  doc.line(cx, cy - r, cx, cy + r);
  doc.line(cx - r, cy, cx + r, cy);
  // Latitudes, shortened to stay inside the circle
  const latitude = r * 0.5;
  const halfWidth = Math.sqrt(r * r - latitude * latitude);
  doc.line(cx - halfWidth, cy - latitude, cx + halfWidth, cy - latitude);
  doc.line(cx - halfWidth, cy + latitude, cx + halfWidth, cy + latitude);
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
  const logo = await loadLogo();

  faces.forEach((face, i) => {
    if (i > 0) doc.addPage();
    drawBrand(doc, logo, labels.appTitle);
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
