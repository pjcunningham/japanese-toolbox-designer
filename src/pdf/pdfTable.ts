import type { PDFPage, PDFFont } from 'pdf-lib';
import type { CutList, CutListItem } from '../manufacturing/types';
import type { UnitSystem } from '../domain/design';
import { formatDimension } from '../domain/units';
import { toPdfSafeText, wrapText } from './pdfText';
import {
  COLOR_TEXT_PRIMARY,
  COLOR_TEXT_SECONDARY,
  COLOR_RULE,
  COLOR_HEADER_BG,
  COLOR_ROW_ALT_BG,
} from './pdfLayout';

export interface CutListTableFonts {
  regular: PDFFont;
  bold: PDFFont;
}

export interface CutListColumn {
  id: string;
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export const COL_PART: CutListColumn = { id: 'part', header: 'Part', width: 175, align: 'left' };
export const COL_QTY: CutListColumn = { id: 'qty', header: 'Qty', width: 40, align: 'center' };
export const COL_LENGTH: CutListColumn = {
  id: 'length',
  header: 'Length',
  width: 75,
  align: 'left',
};
export const COL_WIDTH: CutListColumn = { id: 'width', header: 'Width', width: 75, align: 'left' };
export const COL_THICKNESS: CutListColumn = {
  id: 'thickness',
  header: 'Thickness',
  width: 75,
  align: 'left',
};
export const COL_NOTES: CutListColumn = {
  id: 'notes',
  header: 'Notes',
  width: 329.89,
  align: 'left',
};

export const CUT_LIST_COLUMNS: readonly CutListColumn[] = [
  COL_PART,
  COL_QTY,
  COL_LENGTH,
  COL_WIDTH,
  COL_THICKNESS,
  COL_NOTES,
];

export interface CutListRowLayout {
  item: CutListItem;
  nameLines: string[];
  notesLines: string[];
  height: number;
}

/**
 * Computes deterministic row layouts and heights based on wrapped text.
 */
export function calculateCutListRowLayouts(
  items: CutListItem[],
  fonts: CutListTableFonts,
): CutListRowLayout[] {
  const nameColWidth = COL_PART.width - 12; // padding
  const notesColWidth = COL_NOTES.width - 12;

  return items.map((item) => {
    const nameLines = wrapText(item.name, fonts.bold, 8.5, nameColWidth);
    const combinedNotes = item.notes.join(' ');
    const notesLines = wrapText(combinedNotes, fonts.regular, 8, notesColWidth);

    const maxLines = Math.max(nameLines.length, notesLines.length, 1);
    const height = Math.max(22, 10 + maxLines * 11);

    return {
      item,
      nameLines,
      notesLines,
      height,
    };
  });
}

/**
 * Renders the Cut List table onto the specified PDF page.
 */
export function renderCutListTable(
  page: PDFPage,
  cutList: CutList,
  startX: number,
  startY: number,
  unitSystem: UnitSystem,
  fonts: CutListTableFonts,
): number {
  const tableWidth = CUT_LIST_COLUMNS.reduce((sum, col) => sum + col.width, 0);
  const headerHeight = 22;

  let currentY = startY;

  // 1. Draw Table Header Background
  page.drawRectangle({
    x: startX,
    y: currentY - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: COLOR_HEADER_BG,
    borderWidth: 0.75,
    borderColor: COLOR_RULE,
  });

  // 2. Draw Table Header Text
  let colX = startX;
  for (const col of CUT_LIST_COLUMNS) {
    const text = col.header;
    const textWidth = fonts.bold.widthOfTextAtSize(text, 8.5);
    let cellTextX = colX + 6;
    if (col.align === 'center') {
      cellTextX = colX + (col.width - textWidth) / 2;
    } else if (col.align === 'right') {
      cellTextX = colX + col.width - textWidth - 6;
    }

    page.drawText(text, {
      x: cellTextX,
      y: currentY - 14,
      size: 8.5,
      font: fonts.bold,
      color: COLOR_TEXT_PRIMARY,
    });
    colX += col.width;
  }

  currentY -= headerHeight;

  // 3. Compute Row Layouts
  const rowLayouts = calculateCutListRowLayouts(cutList.items, fonts);

  // 4. Draw Rows
  rowLayouts.forEach((row, index) => {
    const { item, nameLines, notesLines, height } = row;
    const isAlt = index % 2 === 1;

    // Row background
    if (isAlt) {
      page.drawRectangle({
        x: startX,
        y: currentY - height,
        width: tableWidth,
        height,
        color: COLOR_ROW_ALT_BG,
      });
    }

    // Bottom border for row
    page.drawLine({
      start: { x: startX, y: currentY - height },
      end: { x: startX + tableWidth, y: currentY - height },
      thickness: 0.5,
      color: COLOR_RULE,
    });

    let currentCellX = startX;

    // Col 0: Part Name
    nameLines.forEach((line, lineIdx) => {
      page.drawText(line, {
        x: currentCellX + 6,
        y: currentY - 13 - lineIdx * 11,
        size: 8.5,
        font: fonts.bold,
        color: COLOR_TEXT_PRIMARY,
      });
    });
    currentCellX += COL_PART.width;

    // Col 1: Quantity
    const qtyStr = `${item.quantity}`;
    const qtyWidth = fonts.regular.widthOfTextAtSize(qtyStr, 8.5);
    page.drawText(qtyStr, {
      x: currentCellX + (COL_QTY.width - qtyWidth) / 2,
      y: currentY - 13,
      size: 8.5,
      font: fonts.regular,
      color: COLOR_TEXT_PRIMARY,
    });
    currentCellX += COL_QTY.width;

    // Col 2: Length
    const lenStr = toPdfSafeText(formatDimension(item.dimensions.length, unitSystem));
    page.drawText(lenStr, {
      x: currentCellX + 6,
      y: currentY - 13,
      size: 8.5,
      font: fonts.regular,
      color: COLOR_TEXT_PRIMARY,
    });
    currentCellX += COL_LENGTH.width;

    // Col 3: Width
    const widthStr = toPdfSafeText(formatDimension(item.dimensions.width, unitSystem));
    page.drawText(widthStr, {
      x: currentCellX + 6,
      y: currentY - 13,
      size: 8.5,
      font: fonts.regular,
      color: COLOR_TEXT_PRIMARY,
    });
    currentCellX += COL_WIDTH.width;

    // Col 4: Thickness
    const thickStr = toPdfSafeText(formatDimension(item.dimensions.thickness, unitSystem));
    page.drawText(thickStr, {
      x: currentCellX + 6,
      y: currentY - 13,
      size: 8.5,
      font: fonts.regular,
      color: COLOR_TEXT_PRIMARY,
    });
    currentCellX += COL_THICKNESS.width;

    // Col 5: Notes
    notesLines.forEach((line, lineIdx) => {
      page.drawText(line, {
        x: currentCellX + 6,
        y: currentY - 13 - lineIdx * 11,
        size: 8,
        font: fonts.regular,
        color: COLOR_TEXT_SECONDARY,
      });
    });

    currentY -= height;
  });

  // Draw outer box borders for the table
  page.drawRectangle({
    x: startX,
    y: currentY,
    width: tableWidth,
    height: startY - currentY,
    borderWidth: 0.75,
    borderColor: COLOR_RULE,
  });

  return currentY;
}
