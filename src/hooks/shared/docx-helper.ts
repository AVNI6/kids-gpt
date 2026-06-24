import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  ExternalHyperlink,
  IRunOptions,
  ParagraphChild,
} from "docx";

/**
 * Splits text into individual TextRuns, ensuring emojis use the "Segoe UI Emoji" font
 * to render in color in Microsoft Word on Windows (and fallback on other systems).
 */
function createTextRunsForText(text: string, baseOptions: IRunOptions = {}): TextRun[] {
  const runs: TextRun[] = [];
  // Split using unicode property escapes to capture all modern emojis
  const emojiRegex = /(\p{Extended_Pictographic}+)/gu;
  const parts = text.split(emojiRegex);

  parts.forEach((part) => {
    if (!part) return;

    const isEmoji = /\p{Extended_Pictographic}/u.test(part);
    if (isEmoji) {
      const emojiOptions = { ...baseOptions };
      delete emojiOptions.color;
      runs.push(
        new TextRun({
          ...emojiOptions,
          text: part,
          font: "Segoe UI Emoji",
        })
      );
    } else {
      runs.push(
        new TextRun({
          ...baseOptions,
          text: part,
        })
      );
    }
  });

  return runs;
}

/**
 * Tokenizes and parses a line of text for inline formatting (bold, italic, inline code, and links).
 */
function parseInlineText(text: string): ParagraphChild[] {
  const runs: ParagraphChild[] = [];

  // Match bold (**text**), italic (*text*), code (`text`), and link ([text](url))
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  parts.forEach((part) => {
    if (!part) return;

    if (part.startsWith("**") && part.endsWith("**")) {
      const content = part.slice(2, -2);
      runs.push(...createTextRunsForText(content, { bold: true, color: "0F172A" }));
    } else if (part.startsWith("*") && part.endsWith("*")) {
      const content = part.slice(1, -1);
      runs.push(...createTextRunsForText(content, { italics: true, color: "334155" }));
    } else if (part.startsWith("`") && part.endsWith("`")) {
      const content = part.slice(1, -1);
      runs.push(
        new TextRun({
          text: content,
          font: "Consolas",
          shading: { fill: "F1F5F9" },
          color: "0F172A",
        })
      );
    } else if (part.startsWith("[") && part.includes("](")) {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const linkText = linkMatch[1];
        const linkUrl = linkMatch[2];
        runs.push(
          new ExternalHyperlink({
            children: createTextRunsForText(linkText, {
              color: "2563EB", // Standard accessible blue link
              underline: {},
            }),
            link: linkUrl,
          })
        );
      } else {
        runs.push(...createTextRunsForText(part, { color: "334155" }));
      }
    } else {
      runs.push(...createTextRunsForText(part, { color: "334155" }));
    }
  });

  return runs;
}

/**
 * Programmatically parses a Markdown document and generates a .docx Blob using the `docx` library.
 */
export async function generateDocxBlob(markdown: string): Promise<Blob> {
  const lines = markdown.split("\n");
  const docElements: (Paragraph | Table)[] = [];

  let currentListItems: string[] = [];
  let currentListType: "ul" | "ol" | null = null;
  let currentTableRows: string[][] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      currentListItems.forEach((item, index) => {
        const itemContent = parseInlineText(item);
        if (currentListType === "ul") {
          docElements.push(
            new Paragraph({
              children: [new TextRun({ text: "•   ", color: "475569" }), ...itemContent],
              spacing: { after: 120 },
              indent: { left: 720, hanging: 360 },
            })
          );
        } else {
          docElements.push(
            new Paragraph({
              children: [new TextRun({ text: `${index + 1}.  `, color: "475569" }), ...itemContent],
              spacing: { after: 120 },
              indent: { left: 720, hanging: 360 },
            })
          );
        }
      });
      currentListItems = [];
      currentListType = null;
    }
  };

  const flushTable = () => {
    if (currentTableRows.length > 0) {
      const tableRowsList: TableRow[] = [];

      currentTableRows.forEach((row, rowIndex) => {
        const cells: TableCell[] = [];
        row.forEach((cellText) => {
          const isHeader = rowIndex === 0;
          const cellContent = parseInlineText(cellText);

          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: cellContent,
                  spacing: { before: 120, after: 120 },
                }),
              ],
              shading: {
                fill: isHeader ? "F8FAFC" : "FFFFFF",
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
                right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
              },
              margins: {
                top: 140,
                bottom: 140,
                left: 180,
                right: 180,
              },
            })
          );
        });

        tableRowsList.push(
          new TableRow({
            children: cells,
          })
        );
      });

      docElements.push(
        new Table({
          rows: tableRowsList,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        })
      );

      currentTableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      flushTable();
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      flushTable();
      const level = headingMatch[1].length;
      const titleText = headingMatch[2];

      let headingLevel: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1;
      let fontSize = 24; // 12pt
      let spaceBefore = 240;
      const spaceAfter = 120;

      if (level === 1) {
        headingLevel = HeadingLevel.HEADING_1;
        fontSize = 36; // 18pt
        spaceBefore = 360;
      } else if (level === 2) {
        headingLevel = HeadingLevel.HEADING_2;
        fontSize = 28; // 14pt
        spaceBefore = 280;
      } else if (level === 3) {
        headingLevel = HeadingLevel.HEADING_3;
        fontSize = 24; // 12pt
        spaceBefore = 240;
      }

      docElements.push(
        new Paragraph({
          heading: headingLevel,
          children: createTextRunsForText(titleText, {
            color: "0F172A",
            bold: true,
            size: fontSize,
          }),
          spacing: { before: spaceBefore, after: spaceAfter },
        })
      );
      continue;
    }

    // Lists
    const uListMatch = line.match(/^([*\-+])\s+(.*)$/);
    const oListMatch = line.match(/^(\d+)\.\s+(.*)$/);

    if (uListMatch || oListMatch) {
      flushTable();
      const type = uListMatch ? "ul" : "ol";
      const content = uListMatch ? uListMatch[2] : oListMatch![2];

      if (currentListType && currentListType !== type) {
        flushList();
      }

      currentListType = type;
      currentListItems.push(content);
      continue;
    }

    // Tables
    const isTableRow = line.startsWith("|") && line.endsWith("|");
    if (isTableRow) {
      flushList();
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      const isSeparator = cells.every((c) => /^:\?-+:?$/.test(c) || /^-+$/.test(c));

      if (isSeparator) {
        continue;
      }
      currentTableRows.push(cells);
      continue;
    }

    // Blockquotes
    if (line.startsWith(">")) {
      flushList();
      flushTable();
      const content = line.substring(1).trim();
      const parsedRuns = parseInlineText(content);

      docElements.push(
        new Paragraph({
          children: parsedRuns,
          spacing: { before: 180, after: 180 },
          indent: { left: 720 },
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: 24, // 3pt
              space: 12,
              color: "94A3B8",
            },
          },
          shading: {
            fill: "F8FAFC",
          },
        })
      );
      continue;
    }

    // Fallback block closures
    if (currentListItems.length > 0) flushList();
    if (currentTableRows.length > 0) flushTable();

    // Plain paragraph
    const inlineContent = parseInlineText(line);
    docElements.push(
      new Paragraph({
        children: inlineContent,
        spacing: { after: 180, line: 276 },
      })
    );
  }

  // Final flush
  flushList();
  flushTable();

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docElements,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Triggers a standard browser download of a given Blob.
 */
export function downloadDocxBlob(blob: Blob, fileName: string): void {
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
 * Fetches a Docx from a remote storage URL and downloads it locally.
 */
export async function downloadDocxFromUrl(url: string, fileName: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Word document from URL: ${response.statusText}`);
  }
  const blob = await response.blob();
  downloadDocxBlob(blob, fileName);
}
