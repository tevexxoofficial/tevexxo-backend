const PDFDocument = require('pdfkit');
const path = require('path');

const FONT_REG = path.join(__dirname, '..', '..', 'assets', 'fonts', 'DejaVuSans.ttf');
const FONT_BOLD = path.join(__dirname, '..', '..', 'assets', 'fonts', 'DejaVuSans-Bold.ttf');

const NAVY = '#12213b';
const ORANGE = '#f97316';
const GRID = '#d9e0ea';
const ZEBRA = '#f4f6fa';
const INK = '#1e293b';
const MUTED = '#64748b';

const PAGE_W = 842; // A4 landscape
const PAGE_H = 595;
const MARGIN = 32;
const CONTENT_W = PAGE_W - MARGIN * 2;
const ROW_H = 17;
const HEAD_H = 21;

function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

/**
 * Streams a professional tabular PDF report to an Express response.
 * - header band with brand/title/timestamp
 * - optional summary stat tiles
 * - zebra-striped table, repeated header row, auto page breaks
 * - "Page X of Y" footer on every page
 *
 * columns: [{ header, width, align?: 'left'|'right'|'center', value: (row) => string }]
 */
function streamTablePdf(res, { filename, title, subtitle, summary = [], columns, rows, onInfo }) {
  let y = 64 + 18;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: MARGIN, bufferPages: true });
  doc.pipe(res);

  doc.registerFont('body', FONT_REG);
  doc.registerFont('bold', FONT_BOLD);

  const now = new Date();
  const generated = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 16)} UTC`;

  // ---- Header band ----
  doc.rect(0, 0, PAGE_W, 64).fill(NAVY);
  doc.font('bold').fontSize(17).fillColor('#ffffff').text('Tevexxo Admin Report', MARGIN, 14);
  doc.font('body').fontSize(10).fillColor('#c7d2e4')
    .text(`${title}${subtitle ? ` - ${subtitle}` : ''}`, MARGIN, 37);
  doc.font('body').fontSize(8.5).fillColor('#9fb0cc')
    .text(`Generated: ${generated}`, PAGE_W - MARGIN - 190, 25, { width: 190, align: 'right' });

  // ---- Summary tiles ----
  if (summary.length) {
    const tileW = Math.min(170, Math.floor((CONTENT_W - 12 * (summary.length - 1)) / summary.length));
    let x = MARGIN;
    for (const s of summary) {
      doc.roundedRect(x, y, tileW, 46, 6).fill(ZEBRA);
      doc.font('bold').fontSize(15).fillColor(NAVY)
        .text(esc(s.value), x + 12, y + 7, { width: tileW - 24 });
      doc.font('body').fontSize(8).fillColor(MUTED)
        .text(s.label.toUpperCase(), x + 12, y + 28, { width: tileW - 24 });
      x += tileW + 12;
    }
    y += 46 + 16;
  } else {
    y += 4;
  }

  // ---- Column geometry ----
  const totalW = columns.reduce((s, c) => s + c.width, 0);
  const scale = CONTENT_W / totalW;
  const xs = [];
  let acc = MARGIN;
  for (const c of columns) {
    xs.push(acc);
    acc += c.width * scale;
  }

  const bottomLimit = PAGE_H - MARGIN - 20;

  function tableHead() {
    doc.rect(MARGIN, y, CONTENT_W, HEAD_H).fill(NAVY);
    doc.font('bold').fontSize(8.5).fillColor('#ffffff');
    columns.forEach((c, i) => {
      doc.text(c.header, xs[i] + 5, y + 6, { width: c.width * scale - 10, height: HEAD_H - 4, align: c.align || 'left', lineBreak: false, ellipsis: true });
    });
    y += HEAD_H;
  }

  function ensureSpace() {
    if (y + ROW_H > bottomLimit) {
      doc.addPage();
      y = MARGIN + 8;
      tableHead();
    }
  }

  tableHead();

  if (!rows.length) {
    doc.font('body').fontSize(10).fillColor(MUTED)
      .text('No records found.', MARGIN, y + 10, { width: CONTENT_W, align: 'center' });
    y += ROW_H * 2;
  }

  rows.forEach((row, idx) => {
    ensureSpace();
    if (idx % 2 === 1) doc.rect(MARGIN, y, CONTENT_W, ROW_H).fill(ZEBRA);
    doc.font('body').fontSize(8).fillColor(INK);
    columns.forEach((c, i) => {
      doc.text(esc(c.value ? c.value(row, idx) : row[c.header]), xs[i] + 5, y + 4, {
        width: c.width * scale - 10,
        height: ROW_H - 5,
        align: c.align || 'left',
        lineBreak: false,
        ellipsis: true,
      });
    });
    doc.moveTo(MARGIN, y + ROW_H).lineTo(PAGE_W - MARGIN, y + ROW_H).lineWidth(0.5).stroke(GRID);
    y += ROW_H;
  });

  // accent underline on last content page (must run BEFORE switchToPage footer
  // pass - any content op after switchToPage makes pdfkit spawn a phantom page)
  doc.moveTo(MARGIN, y + 8).lineTo(MARGIN + 60, y + 8).lineWidth(2).strokeColor(ORANGE).stroke();

  // ---- Footers with page numbers ----
  // NOTE: do NOT use { width, align } on switched pages - pdfkit's wrap logic
  // then spawns a phantom extra page. Position manually instead.
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.font('body').fontSize(7.5).fillColor(MUTED)
      .text(`Tevexxo Admin Panel - ${title} - Generated ${generated}`, MARGIN, PAGE_H - 26, { lineBreak: false });
    const label = `Page ${i + 1} of ${range.count}`;
    doc.font('bold').fontSize(7.5).fillColor(MUTED);
    doc.text(label, PAGE_W - MARGIN - doc.widthOfString(label), PAGE_H - 26, { lineBreak: false });
  }

  const finalRange = doc.bufferedPageRange();
  if (onInfo) onInfo({ pages: finalRange.count });
  doc.end();
}

module.exports = { streamTablePdf };
