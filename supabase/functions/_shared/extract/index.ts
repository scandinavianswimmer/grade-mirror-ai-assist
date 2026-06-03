// Server-side document extraction: DOCX (mammoth) + PDF (unpdf) + plain text.
// Returns normalized text plus a confidence score. Empty/low-confidence => caller marks the
// submission needs_review and does NOT auto-grade. OCR is a pluggable hook (not enabled by default).
import { extractText as extractPdf, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import mammoth from "npm:mammoth@1.9.1";
import { AppError } from "../http.ts";

export interface ExtractResult {
  text: string;
  confidence: number; // 0..1
  pages: number;
  warnings: string[];
}

const MAX_BYTES = 20 * 1024 * 1024; // 20MB guard
// Page cap (Layer D): a <20MB PDF can still carry thousands of pages → heavy parse cost + an
// unbounded downstream grading prompt. A single student essay is realistically well under this.
const MAX_PAGES = 50;

function detectKind(filename: string, bytes: Uint8Array): "pdf" | "docx" | "text" | "unknown" {
  // Magic bytes first; fall back to extension. Don't trust the extension alone.
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "pdf"; // %PDF
  }
  if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    // PK zip — DOCX is a zip; trust extension to disambiguate from other zips.
    if (/\.docx$/i.test(filename)) return "docx";
  }
  if (/\.pdf$/i.test(filename)) return "pdf";
  if (/\.docx$/i.test(filename)) return "docx";
  if (/\.(txt|md|csv|json)$/i.test(filename)) return "text";
  return "unknown";
}

// Cleanup: NFC, de-hyphenate line wraps, collapse runs of blank lines, trim.
function normalizeText(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/-\n(?=\w)/g, "") // join hyphenated line wraps
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Heuristic confidence: ratio of printable/word-like content. Scanned PDFs with no text layer
// extract near-empty => low confidence => needs_review.
function scoreConfidence(text: string): number {
  if (!text || text.trim().length < 20) return 0;
  const words = text.split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w));
  const printableRatio = (text.match(/[\x20-\x7E\n]/g)?.length ?? 0) / text.length;
  if (words.length < 10) return 0.2;
  return Math.min(1, printableRatio * Math.min(1, words.length / 50));
}

export async function extractDocument(filename: string, bytes: Uint8Array): Promise<ExtractResult> {
  if (bytes.length > MAX_BYTES) {
    throw new AppError(413, "extract", `File exceeds ${MAX_BYTES} byte limit`);
  }
  const kind = detectKind(filename, bytes);
  const warnings: string[] = [];
  let text = "";
  let pages = 1;

  try {
    if (kind === "pdf") {
      const pdf = await getDocumentProxy(bytes);
      // Page cap before the full extract pass — reject oversized PDFs early.
      const totalPages = (pdf as unknown as { numPages?: number }).numPages ?? 0;
      if (totalPages > MAX_PAGES) {
        throw new AppError(413, "extract", `PDF has too many pages (${totalPages}; max ${MAX_PAGES}). Submit a single essay.`);
      }
      const res = await extractPdf(pdf, { mergePages: true });
      text = Array.isArray(res.text) ? res.text.join("\n") : (res.text as string);
      pages = res.totalPages ?? (totalPages || 1);
    } else if (kind === "docx") {
      const res = await mammoth.extractRawText({ buffer: bytes });
      text = res.value ?? "";
      if (res.messages?.length) warnings.push(`mammoth: ${res.messages.length} message(s)`);
    } else if (kind === "text") {
      text = new TextDecoder().decode(bytes);
    } else {
      throw new AppError(415, "extract", `Unsupported or unrecognized file type: ${filename}`);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(422, "extract", `Failed to parse ${kind} document`);
  }

  const normalized = normalizeText(text);
  let confidence = scoreConfidence(normalized);

  // Scanned/image PDFs: empty text layer. Hook for OCR (disabled unless OCR_PROVIDER configured).
  if (kind === "pdf" && confidence < 0.2) {
    warnings.push("Low/empty PDF text layer — likely scanned. OCR not enabled; flagged for review.");
    // const ocr = await runOcr(bytes); if (ocr) { text = ocr; confidence = scoreConfidence(text); }
  }

  return { text: normalized, confidence: Number(confidence.toFixed(2)), pages, warnings };
}
