import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for browser client side
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface TextItemWithPos {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extracts text from a raw PDF buffer (ArrayBuffer or Uint8Array)
 */
export async function extractTextFromPdfBuffer(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdfDoc = await loadingTask.promise;

  let fullText = '';

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    const items: TextItemWithPos[] = [];

    for (const item of textContent.items) {
      if (item && typeof item === 'object' && 'str' in item && 'transform' in item) {
        const tItem = item as { str: string; transform: number[]; width?: number; height?: number };
        const str = tItem.str;
        if (!str && str !== ' ') continue;

        const x = tItem.transform[4];
        const y = tItem.transform[5];
        items.push({
          str,
          x,
          y,
          width: tItem.width || 0,
          height: tItem.height || 0,
        });
      }
    }

    // Sort items: Top to Bottom (Y descending), then Left to Right (X ascending)
    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3.5) {
        return yDiff;
      }
      return a.x - b.x;
    });

    // Group into lines by similar Y coordinate
    const lines: string[] = [];
    let currentLineItems: TextItemWithPos[] = [];
    let currentY: number | null = null;

    for (const item of items) {
      if (currentY === null || Math.abs(currentY - item.y) <= 3.5) {
        currentLineItems.push(item);
        if (currentY === null) currentY = item.y;
      } else {
        currentLineItems.sort((a, b) => a.x - b.x);
        lines.push(currentLineItems.map(i => i.str).join(' ').trim());
        currentLineItems = [item];
        currentY = item.y;
      }
    }

    if (currentLineItems.length > 0) {
      currentLineItems.sort((a, b) => a.x - b.x);
      lines.push(currentLineItems.map(i => i.str).join(' ').trim());
    }

    fullText += lines.filter(l => l.length > 0).join('\n') + '\n\n';
  }

  return fullText;
}

/**
 * Extracts text from a PDF file preserving line structure based on geometric coordinates.
 */
export async function extractTextFromPdfFile(file: File): Promise<string> {
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return await file.text();
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    return await extractTextFromPdfBuffer(arrayBuffer);
  } catch (err) {
    console.warn('Failed to extract text using PDF.js, trying fallback text reading:', err);
    return await file.text();
  }
}

