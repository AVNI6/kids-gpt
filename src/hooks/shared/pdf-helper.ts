import React from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { UserRole } from "@/types/common";

/**
 * Lazily loads @react-pdf/renderer and PdfDocument, and renders the PDF to a Blob.
 * This prevents @react-pdf/renderer from being included in the main initial bundle.
 */
export async function generatePdfBlob(content: string, role: UserRole): Promise<Blob> {
  const { pdf } = await import("@react-pdf/renderer");
  const { PdfDocument } = await import("@/components/ui/PdfDocument");

  // Renders the PdfDocument component to PDF format
  const element = React.createElement(PdfDocument, {
    content,
    role,
  }) as React.ReactElement<DocumentProps>;
  return await pdf(element).toBlob();
}

/**
 * Triggers a standard browser download of a given Blob.
 */
export function downloadPdfBlob(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();

  // Clean up resources and DOM nodes
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Fetches a PDF from a remote storage URL and downloads it locally.
 */
export async function downloadPdfFromUrl(url: string, fileName: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`);
  }
  const blob = await response.blob();
  downloadPdfBlob(blob, fileName);
}
