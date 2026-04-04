/**
 * Convert compiled LaTeX PDFs to PNG preview images
 */
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

async function convertPdfToPng(pdfPath, pngPath) {
  // Dynamic import for ESM module
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  
  const scale = 2.5; // high-res preview
  const viewport = page.getViewport({ scale });
  
  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext('2d');
  
  // White background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, viewport.width, viewport.height);
  
  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(pngPath, buffer);
  console.log(`  ✅ ${path.basename(pngPath)} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

async function main() {
  const dir = path.join(__dirname, 'public', 'templates');
  const pdfs = fs.readdirSync(dir).filter(f => f.endsWith('.pdf') && f !== 'test_jakeryan.pdf');
  
  console.log('=== Converting PDFs to PNGs ===\n');
  for (const pdf of pdfs) {
    const name = path.basename(pdf, '.pdf');
    try {
      await convertPdfToPng(
        path.join(dir, pdf),
        path.join(dir, name + '.png')
      );
    } catch (e) {
      console.log(`  ❌ ${name}: ${e.message}`);
    }
  }
  
  // Clean up test PDF
  const testPdf = path.join(dir, 'test_jakeryan.pdf');
  if (fs.existsSync(testPdf)) fs.unlinkSync(testPdf);
  
  console.log('\nDone! PNG previews ready.');
}

main().catch(console.error);
