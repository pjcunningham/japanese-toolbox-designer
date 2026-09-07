/**
 * Triggers a browser file download for generated PDF bytes without external dependencies.
 */
export function downloadWorkshopPdf(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes as unknown as BlobPart], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
