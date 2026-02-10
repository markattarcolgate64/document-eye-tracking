export interface TextSpanInfo {
  id: string;
  text: string;
  rect: DOMRect;
  pageIndex: number;
}

const spanRegistry: Map<string, TextSpanInfo> = new Map();

export function registerTextSpans(container: HTMLElement, pageIndex: number) {
  const textLayer = container.querySelector(
    ".rpv-core__text-layer"
  ) as HTMLElement | null;
  if (!textLayer) return;

  const spans = textLayer.querySelectorAll("span");
  spans.forEach((span, idx) => {
    const text = span.textContent?.trim();
    if (!text) return;

    const id = `page-${pageIndex}-span-${idx}`;
    span.setAttribute("data-span-id", id);
    span.style.pointerEvents = "auto";

    spanRegistry.set(id, {
      id,
      text,
      rect: span.getBoundingClientRect(),
      pageIndex,
    });
  });
}

export function refreshSpanRects(container: HTMLElement) {
  const spans = container.querySelectorAll("[data-span-id]");
  spans.forEach((span) => {
    const id = span.getAttribute("data-span-id");
    if (!id) return;
    const info = spanRegistry.get(id);
    if (info) {
      info.rect = span.getBoundingClientRect();
    }
  });
}

export function getSpanAtPoint(
  x: number,
  y: number
): TextSpanInfo | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;

  const spanEl =
    el.closest("[data-span-id]") || (el.hasAttribute("data-span-id") ? el : null);
  if (!spanEl) return null;

  const id = spanEl.getAttribute("data-span-id");
  if (!id) return null;

  return spanRegistry.get(id) ?? null;
}

export function getAllSpans(): TextSpanInfo[] {
  return Array.from(spanRegistry.values());
}

export function getTotalSpanCount(): number {
  return spanRegistry.size;
}

export function clearRegistry() {
  spanRegistry.clear();
}
