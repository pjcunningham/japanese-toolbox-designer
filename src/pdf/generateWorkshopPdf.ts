import { PDFDocument, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';
import type { WorkshopPdfData, GeneratePdfOptions } from './types';
import { toPdfSafeText, formatGeneratedDate, wrapText } from './pdfText';
import { formatDimension } from '../domain/units';
import {
  A4_PORTRAIT_WIDTH,
  A4_PORTRAIT_HEIGHT,
  A4_LANDSCAPE_WIDTH,
  A4_LANDSCAPE_HEIGHT,
  PAGE_MARGIN,
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_RULE,
  COLOR_HEADER_BG,
  COLOR_CARD_BG,
} from './pdfLayout';
import { renderTechnicalDrawing } from './pdfDrawingRenderer';
import { renderCutListTable } from './pdfTable';
import type { ProcessPlanStep } from '../manufacturing/types';

interface EmbeddedFonts {
  regular: PDFFont;
  bold: PDFFont;
  oblique: PDFFont;
}

/**
 * Draws a section card on the Design Summary page.
 */
function drawSummaryCard(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  rows: Array<[string, string]>,
  fonts: EmbeddedFonts,
  note?: string,
): number {
  // Background card
  page.drawRectangle({
    x,
    y: y - height,
    width,
    height,
    color: COLOR_CARD_BG,
    borderWidth: 0.75,
    borderColor: COLOR_RULE,
  });

  // Card title banner
  const bannerHeight = 20;
  page.drawRectangle({
    x,
    y: y - bannerHeight,
    width,
    height: bannerHeight,
    color: COLOR_HEADER_BG,
    borderWidth: 0.75,
    borderColor: COLOR_RULE,
  });

  page.drawText(title, {
    x: x + 8,
    y: y - 14,
    size: 9.5,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  // Rows of key-value pairs
  let rowY = y - bannerHeight - 14;
  for (const [label, value] of rows) {
    page.drawText(label, {
      x: x + 10,
      y: rowY,
      size: 8.5,
      font: fonts.regular,
      color: COLOR_TEXT_SECONDARY,
    });

    const safeVal = toPdfSafeText(value);
    const valWidth = fonts.bold.widthOfTextAtSize(safeVal, 8.5);
    page.drawText(safeVal, {
      x: x + width - 10 - valWidth,
      y: rowY,
      size: 8.5,
      font: fonts.bold,
      color: COLOR_TEXT_PRIMARY,
    });

    rowY -= 13;
  }

  // Optional note at bottom of card
  if (note) {
    const wrappedNote = wrapText(note, fonts.oblique, 7.5, width - 20);
    let noteY = rowY - 2;
    for (const line of wrappedNote) {
      page.drawText(line, {
        x: x + 10,
        y: noteY,
        size: 7.5,
        font: fonts.oblique,
        color: COLOR_TEXT_SECONDARY,
      });
      noteY -= 9.5;
    }
  }

  return y - height;
}

/**
 * Renders the Page 1 - Design Summary (Portrait A4).
 */
function renderDesignSummaryPage(
  page: PDFPage,
  data: WorkshopPdfData,
  generatedAt: Date,
  fonts: EmbeddedFonts,
): void {
  const { design, geometry, wood } = data;
  const unitSystem = design.unitSystem;
  const leftX = PAGE_MARGIN;
  const printableWidth = A4_PORTRAIT_WIDTH - PAGE_MARGIN * 2;

  let currentY = A4_PORTRAIT_HEIGHT - PAGE_MARGIN;

  // Title
  page.drawText('Japanese Toolbox Workshop Plan', {
    x: leftX,
    y: currentY - 18,
    size: 18,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  currentY -= 26;

  // Subtitle / App header
  page.drawText('Authoritative Workshop Document  |  Parametric Japanese Toolbox Designer', {
    x: leftX,
    y: currentY,
    size: 8.5,
    font: fonts.regular,
    color: COLOR_TEXT_SECONDARY,
  });

  currentY -= 10;

  // Divider Rule
  page.drawLine({
    start: { x: leftX, y: currentY },
    end: { x: leftX + printableWidth, y: currentY },
    thickness: 1,
    color: COLOR_RULE,
  });

  currentY -= 14;

  // Top Meta Box
  const metaHeight = 54;
  page.drawRectangle({
    x: leftX,
    y: currentY - metaHeight,
    width: printableWidth,
    height: metaHeight,
    color: COLOR_CARD_BG,
    borderWidth: 0.75,
    borderColor: COLOR_RULE,
  });

  // Design Name & Wood
  page.drawText(toPdfSafeText(design.name), {
    x: leftX + 12,
    y: currentY - 18,
    size: 13,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  page.drawText(`Wood: ${toPdfSafeText(wood.name)}`, {
    x: leftX + 12,
    y: currentY - 34,
    size: 9,
    font: fonts.regular,
    color: COLOR_TEXT_SECONDARY,
  });

  // Overall Outside Dimensions & Units
  const overallX = formatDimension(geometry.box.outside.length, unitSystem);
  const overallY = formatDimension(geometry.box.outside.width, unitSystem);
  const overallZ = formatDimension(geometry.box.outside.bodyHeight, unitSystem);
  const overallStr = `Overall: ${overallX} x ${overallY} x ${overallZ}`;
  const overallSafe = toPdfSafeText(overallStr);
  const overallWidth = fonts.bold.widthOfTextAtSize(overallSafe, 9.5);

  page.drawText(overallSafe, {
    x: leftX + printableWidth - 12 - overallWidth,
    y: currentY - 18,
    size: 9.5,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  const dateStr = `Generated: ${formatGeneratedDate(generatedAt)}  |  Units: ${unitSystem === 'metric' ? 'Metric' : 'Imperial'}`;
  const dateSafe = toPdfSafeText(dateStr);
  const dateWidth = fonts.regular.widthOfTextAtSize(dateSafe, 8.5);

  page.drawText(dateSafe, {
    x: leftX + printableWidth - 12 - dateWidth,
    y: currentY - 34,
    size: 8.5,
    font: fonts.regular,
    color: COLOR_TEXT_SECONDARY,
  });

  currentY -= metaHeight + 14;

  // 1. Carcass Specification Card
  const carcassRows: Array<[string, string]> = [
    [
      'Main stock thickness',
      formatDimension(geometry.box.parts.side.dimensions.thickness, unitSystem),
    ],
    [
      'Bottom thickness',
      formatDimension(geometry.box.parts.bottom.dimensions.thickness, unitSystem),
    ],
    [
      'End-wall inset / handle depth',
      formatDimension(design.constructionParameters.endHandleDepth, unitSystem),
    ],
    ['Handle height', formatDimension(design.constructionParameters.endHandleHeight, unitSystem)],
    [
      'Housing dado depth',
      formatDimension(design.constructionParameters.housingDadoDepth, unitSystem),
    ],
    [
      'End-cap width',
      formatDimension(design.constructionParameters.fixedTopBattenWidth, unitSystem),
    ],
    ['Pocket depth', formatDimension(geometry.box.topOpening.battenInteriorProjection, unitSystem)],
    [
      'Internal cavity (L x W x H)',
      `${formatDimension(geometry.box.internal.length, unitSystem)} x ${formatDimension(geometry.box.internal.width, unitSystem)} x ${formatDimension(geometry.box.internal.height, unitSystem)}`,
    ],
  ];

  currentY =
    drawSummaryCard(
      page,
      leftX,
      currentY,
      printableWidth,
      138,
      'Carcass Specification',
      carcassRows,
      fonts,
    ) - 12;

  // 2. Lid Construction & Kinematics Card
  const lidRows: Array<[string, string]> = [
    ['Lid thickness', formatDimension(geometry.lid.panel.dimensions.thickness, unitSystem)],
    [
      'Lid panel size (L x W)',
      `${formatDimension(geometry.lid.panel.dimensions.length, unitSystem)} x ${formatDimension(geometry.lid.panel.dimensions.width, unitSystem)}`,
    ],
    [
      'Side clearance (per side)',
      formatDimension(geometry.lid.lateralFit.clearancePerSide, unitSystem),
    ],
    [
      'Locked overlap (per end)',
      formatDimension(geometry.lid.longitudinalFit.lockedOverlapPerEnd, unitSystem),
    ],
    [
      'Available lid travel',
      formatDimension(geometry.lid.longitudinalFit.availableTravel, unitSystem),
    ],
    [
      'Release travel margin',
      formatDimension(geometry.lid.longitudinalFit.releaseTravelMargin, unitSystem),
    ],
  ];

  currentY =
    drawSummaryCard(
      page,
      leftX,
      currentY,
      printableWidth,
      112,
      'Lid Construction & Kinematics',
      lidRows,
      fonts,
    ) - 12;

  // 3. Locking Mechanism Specification Card
  const lockingRows: Array<[string, string]> = [
    ['Plan taper (alpha)', `${geometry.lockingMechanism.wedge.taperAngle} deg`],
    ['Retaining bevel (beta)', `${geometry.lockingMechanism.wedge.bevelAngle} deg`],
    [
      'Locking travel clearance',
      formatDimension(design.constructionParameters.lockingBattenTravelClearance, unitSystem),
    ],
    [
      'Wedge narrow width',
      formatDimension(geometry.lockingMechanism.wedge.bottomNarrowWidth, unitSystem),
    ],
    [
      'Wedge wide width',
      formatDimension(geometry.lockingMechanism.wedge.bottomWideWidth, unitSystem),
    ],
    [
      'Working taper length',
      formatDimension(geometry.lockingMechanism.wedge.workingLength, unitSystem),
    ],
    [
      'Recommended wedge blank length',
      formatDimension(geometry.lockingMechanism.wedge.recommendedBlankLength, unitSystem),
    ],
  ];

  const lockingNote =
    'The locking wedge is tapered in plan and bevelled vertically so the profile is captured rather than relying on gravity.';

  currentY =
    drawSummaryCard(
      page,
      leftX,
      currentY,
      printableWidth,
      142,
      'Locking Mechanism Specification',
      lockingRows,
      fonts,
      lockingNote,
    ) - 14;

  // Workshop Nominal Dimensions Note Box
  page.drawRectangle({
    x: leftX,
    y: currentY - 32,
    width: printableWidth,
    height: 32,
    color: COLOR_HEADER_BG,
    borderWidth: 0.75,
    borderColor: COLOR_RULE,
  });

  page.drawText('Note: Dimensions shown follow the selected Metric/Imperial display resolution.', {
    x: leftX + 10,
    y: currentY - 13,
    size: 7.5,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  page.drawText('The locking wedge should be final-fitted to the assembled box.', {
    x: leftX + 10,
    y: currentY - 24,
    size: 7.5,
    font: fonts.regular,
    color: COLOR_TEXT_SECONDARY,
  });
}

/**
 * Renders a Technical Drawing Page (Landscape A4).
 */
function renderDrawingPage(
  doc: PDFDocument,
  model: WorkshopPdfData['drawings']['front'],
  data: WorkshopPdfData,
  fonts: EmbeddedFonts,
): PDFPage {
  const page = doc.addPage([A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT]);
  const leftX = PAGE_MARGIN;
  const printableWidth = A4_LANDSCAPE_WIDTH - PAGE_MARGIN * 2;

  // Page Title & View Description
  const headerY = A4_LANDSCAPE_HEIGHT - PAGE_MARGIN - 4;
  page.drawText(toPdfSafeText(model.title), {
    x: leftX,
    y: headerY - 12,
    size: 15,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  const descSafe = toPdfSafeText(model.description);
  page.drawText(descSafe, {
    x: leftX,
    y: headerY - 26,
    size: 8.5,
    font: fonts.regular,
    color: COLOR_TEXT_SECONDARY,
  });

  // Target viewport rectangle for vector technical drawing
  const targetRect = {
    x: leftX,
    y: 48,
    width: printableWidth,
    height: A4_LANDSCAPE_HEIGHT - PAGE_MARGIN - 48 - 36,
  };

  renderTechnicalDrawing(page, model, targetRect, data.design.unitSystem, {
    regular: fonts.regular,
    bold: fonts.bold,
  });

  return page;
}

/**
 * Renders the Cut List Page (Landscape A4).
 */
function renderCutListPage(doc: PDFDocument, data: WorkshopPdfData, fonts: EmbeddedFonts): PDFPage {
  const page = doc.addPage([A4_LANDSCAPE_WIDTH, A4_LANDSCAPE_HEIGHT]);
  const leftX = PAGE_MARGIN;
  const printableWidth = A4_LANDSCAPE_WIDTH - PAGE_MARGIN * 2;
  const unitSystem = data.design.unitSystem;

  let currentY = A4_LANDSCAPE_HEIGHT - PAGE_MARGIN - 4;

  // Title
  page.drawText('Cut List', {
    x: leftX,
    y: currentY - 14,
    size: 16,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  // Subtitle / Meta
  const unitLabel = unitSystem === 'metric' ? 'Metric (mm)' : 'Imperial (in)';
  const subMeta = `Design: ${toPdfSafeText(data.design.name)}  |  Wood: ${toPdfSafeText(data.wood.name)}  |  Units: ${unitLabel}`;
  page.drawText(subMeta, {
    x: leftX,
    y: currentY - 28,
    size: 8.5,
    font: fonts.regular,
    color: COLOR_TEXT_SECONDARY,
  });

  // Summary counts
  const summaryStr = `${data.cutList.summary.lineItemCount} line items  |  ${data.cutList.summary.stockBlankCount} stock blanks  |  ${data.cutList.summary.finishedPartCount} finished parts`;
  const summarySafe = toPdfSafeText(summaryStr);
  const summaryWidth = fonts.bold.widthOfTextAtSize(summarySafe, 9);
  page.drawText(summarySafe, {
    x: leftX + printableWidth - summaryWidth,
    y: currentY - 14,
    size: 9,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  currentY -= 40;

  renderCutListTable(page, data.cutList, leftX, currentY, unitSystem, {
    regular: fonts.regular,
    bold: fonts.bold,
  });

  return page;
}

/**
 * Calculates height needed for a process step block.
 */
function calculateStepHeight(
  step: ProcessPlanStep,
  fonts: EmbeddedFonts,
  contentWidth: number,
): number {
  let height = 24; // Title + top margin

  // Instructions
  for (const instruction of step.instructions) {
    const wrapped = wrapText(instruction, fonts.regular, 8.5, contentWidth - 14);
    height += wrapped.length * 11 + 3;
  }

  // Measurements
  if (step.measurements && step.measurements.length > 0) {
    height += step.measurements.length * 11 + 6;
  }

  // Notes
  if (step.notes && step.notes.length > 0) {
    for (const note of step.notes) {
      const wrapped = wrapText(note, fonts.oblique, 7.5, contentWidth - 14);
      height += wrapped.length * 9.5 + 2;
    }
  }

  return height + 8; // Bottom spacing
}

/**
 * Renders a single process step onto the current page.
 */
function renderStep(
  page: PDFPage,
  step: ProcessPlanStep,
  startX: number,
  startY: number,
  contentWidth: number,
  data: WorkshopPdfData,
  fonts: EmbeddedFonts,
): number {
  let currentY = startY;

  // Step Title
  const titleText = `Step ${step.order} - ${toPdfSafeText(step.title)}`;
  page.drawText(titleText, {
    x: startX,
    y: currentY - 11,
    size: 10.5,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  currentY -= 17;

  // Instructions
  for (const instruction of step.instructions) {
    const wrapped = wrapText(instruction, fonts.regular, 8.5, contentWidth - 14);
    // Bullet point
    page.drawText('-', {
      x: startX + 4,
      y: currentY - 9,
      size: 8.5,
      font: fonts.bold,
      color: COLOR_TEXT_SECONDARY,
    });

    for (const line of wrapped) {
      page.drawText(line, {
        x: startX + 14,
        y: currentY - 9,
        size: 8.5,
        font: fonts.regular,
        color: COLOR_TEXT_PRIMARY,
      });
      currentY -= 11;
    }
    currentY -= 2;
  }

  // Measurements
  if (step.measurements && step.measurements.length > 0) {
    currentY -= 2;
    for (const m of step.measurements) {
      let valStr = '';
      if (m.kind === 'linear') {
        valStr = formatDimension(m.value, data.design.unitSystem);
      } else if (m.kind === 'angle') {
        valStr = `${m.valueDegrees} deg`;
      } else if (m.kind === 'text') {
        valStr = m.valueText;
      } else if (m.kind === 'boolean') {
        valStr = m.valueBoolean ? 'Yes' : 'No';
      }

      const measLabel = `${toPdfSafeText(m.label)}: `;
      const measVal = toPdfSafeText(valStr);

      page.drawText(measLabel, {
        x: startX + 14,
        y: currentY - 9,
        size: 8,
        font: fonts.bold,
        color: COLOR_TEXT_SECONDARY,
      });

      const labelWidth = fonts.bold.widthOfTextAtSize(measLabel, 8);
      page.drawText(measVal, {
        x: startX + 14 + labelWidth,
        y: currentY - 9,
        size: 8,
        font: fonts.regular,
        color: COLOR_TEXT_PRIMARY,
      });

      currentY -= 11;
    }
  }

  // Notes
  if (step.notes && step.notes.length > 0) {
    currentY -= 2;
    for (const note of step.notes) {
      const wrapped = wrapText(note, fonts.oblique, 7.5, contentWidth - 14);
      for (const line of wrapped) {
        page.drawText(`* ${line}`, {
          x: startX + 14,
          y: currentY - 8,
          size: 7.5,
          font: fonts.oblique,
          color: COLOR_TEXT_SECONDARY,
        });
        currentY -= 9.5;
      }
    }
  }

  return currentY - 6;
}

/**
 * Renders Process Plan pages with clean page break handling (Portrait A4).
 */
function renderProcessPlanPages(
  doc: PDFDocument,
  data: WorkshopPdfData,
  fonts: EmbeddedFonts,
): void {
  const leftX = PAGE_MARGIN;
  const contentWidth = A4_PORTRAIT_WIDTH - PAGE_MARGIN * 2;
  const bottomLimitY = 50;

  let currentPage = doc.addPage([A4_PORTRAIT_WIDTH, A4_PORTRAIT_HEIGHT]);
  let currentY = A4_PORTRAIT_HEIGHT - PAGE_MARGIN;

  // Title on first process plan page
  currentPage.drawText('Construction Process Plan', {
    x: leftX,
    y: currentY - 14,
    size: 16,
    font: fonts.bold,
    color: COLOR_TEXT_PRIMARY,
  });

  currentPage.drawText(
    `23-step deterministic construction sequence for ${toPdfSafeText(data.design.name)}`,
    {
      x: leftX,
      y: currentY - 28,
      size: 8.5,
      font: fonts.regular,
      color: COLOR_TEXT_SECONDARY,
    },
  );

  currentY -= 42;

  for (const step of data.processPlan.steps) {
    const stepHeight = calculateStepHeight(step, fonts, contentWidth);

    // If step won't fit on current page, start a new page
    if (currentY - stepHeight < bottomLimitY) {
      currentPage = doc.addPage([A4_PORTRAIT_WIDTH, A4_PORTRAIT_HEIGHT]);
      currentY = A4_PORTRAIT_HEIGHT - PAGE_MARGIN - 8;
    }

    currentY = renderStep(currentPage, step, leftX, currentY, contentWidth, data, fonts);
  }
}

/**
 * Renders headers and footers across all pages once total page count is known.
 */
function applyHeadersAndFooters(
  doc: PDFDocument,
  data: WorkshopPdfData,
  generatedAt: Date,
  fonts: EmbeddedFonts,
): void {
  const totalPages = doc.getPageCount();
  const dateFormatted = formatGeneratedDate(generatedAt);
  const safeDesignName = toPdfSafeText(data.design.name);

  for (let i = 0; i < totalPages; i++) {
    const page = doc.getPage(i);
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    const isFirstPage = i === 0;

    // Header (pages 2+)
    if (!isFirstPage) {
      page.drawText('Japanese Toolbox Designer', {
        x: PAGE_MARGIN,
        y: pageHeight - 24,
        size: 8,
        font: fonts.bold,
        color: COLOR_TEXT_SECONDARY,
      });

      const headerRight = safeDesignName;
      const rightWidth = fonts.regular.widthOfTextAtSize(headerRight, 8);
      page.drawText(headerRight, {
        x: pageWidth - PAGE_MARGIN - rightWidth,
        y: pageHeight - 24,
        size: 8,
        font: fonts.regular,
        color: COLOR_TEXT_SECONDARY,
      });

      page.drawLine({
        start: { x: PAGE_MARGIN, y: pageHeight - 30 },
        end: { x: pageWidth - PAGE_MARGIN, y: pageHeight - 30 },
        thickness: 0.5,
        color: COLOR_RULE,
      });
    }

    // Footer (all pages)
    page.drawLine({
      start: { x: PAGE_MARGIN, y: 34 },
      end: { x: pageWidth - PAGE_MARGIN, y: 34 },
      thickness: 0.5,
      color: COLOR_RULE,
    });

    const footerLeft = `Generated ${dateFormatted}`;
    page.drawText(footerLeft, {
      x: PAGE_MARGIN,
      y: 22,
      size: 8,
      font: fonts.regular,
      color: COLOR_TEXT_SECONDARY,
    });

    const pageNumText = `Page ${i + 1} of ${totalPages}`;
    const pageNumWidth = fonts.regular.widthOfTextAtSize(pageNumText, 8);
    page.drawText(pageNumText, {
      x: pageWidth - PAGE_MARGIN - pageNumWidth,
      y: 22,
      size: 8,
      font: fonts.regular,
      color: COLOR_TEXT_SECONDARY,
    });
  }
}

/**
 * Pure generator that renders a complete, multi-page workshop PDF document.
 */
export async function generateWorkshopPdf(
  data: WorkshopPdfData,
  options?: GeneratePdfOptions,
): Promise<Uint8Array> {
  const generatedAt = options?.generatedAt ?? new Date();

  const doc = await PDFDocument.create();

  // PDF Document Metadata
  doc.setTitle(`${toPdfSafeText(data.design.name)} - Japanese Toolbox Workshop Plan`);
  doc.setAuthor('Japanese Toolbox Designer');
  doc.setSubject('Japanese toolbox workshop plan');
  doc.setCreator('Japanese Toolbox Designer');
  doc.setProducer('Japanese Toolbox Designer');
  doc.setCreationDate(generatedAt);
  doc.setModificationDate(generatedAt);

  // Embed standard PDF fonts (offline, no external network fetch)
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const oblique = await doc.embedFont(StandardFonts.HelveticaOblique);
  const fonts: EmbeddedFonts = { regular, bold, oblique };

  // Page 1: Design Summary (Portrait A4)
  const summaryPage = doc.addPage([A4_PORTRAIT_WIDTH, A4_PORTRAIT_HEIGHT]);
  renderDesignSummaryPage(summaryPage, data, generatedAt, fonts);

  // Page 2: Plan Drawing (Landscape A4) - Principal mechanical drawing first
  renderDrawingPage(doc, data.drawings.plan, data, fonts);

  // Page 3: Front Drawing (Landscape A4)
  renderDrawingPage(doc, data.drawings.front, data, fonts);

  // Page 4: End Drawing (Landscape A4)
  renderDrawingPage(doc, data.drawings.end, data, fonts);

  // Page 5: Cut List (Landscape A4)
  renderCutListPage(doc, data, fonts);

  // Pages 6+: Construction Process Plan (Portrait A4)
  renderProcessPlanPages(doc, data, fonts);

  // Apply headers & dynamic page numbering
  applyHeadersAndFooters(doc, data, generatedAt, fonts);

  return await doc.save();
}
