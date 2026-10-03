/** Runs only as trusted CDP evaluation, with page JavaScript/network disabled.
 * Normal documents keep measured source geometry. Oversized units become flowing
 * continuation cards; no authored characters are truncated or silently shrunk.
 */
export function paginateHtmlDocument() {
  const original = document.querySelector<HTMLElement>(".sheet")!;
  const main = original.querySelector<HTMLElement>(".page-content")!;
  const footer = original.querySelector<HTMLElement>(".footer")!;
  const roadmap = document.body.classList.contains("roadmap");
  const height = roadmap ? 1740 : 1684;
  const limit = height - (roadmap ? 78 : 72);
  const dinnerFooterBoundary = footer.offsetTop - 8;
  const header = main.querySelector<HTMLElement>(".header")!;
  const side = header.querySelector<HTMLElement>(".header-right")!;
  const sideBottom = side.offsetTop + side.offsetHeight + 20;
  header.style.minHeight = `${Math.max(header.offsetHeight, sideBottom)}px`;
  const source = Array.from(main.children) as HTMLElement[];
  const pages: HTMLElement[] = [original];
  const contents: HTMLElement[] = [main];
  let sheet = original;
  let content = main;
  main.replaceChildren();
  function newPage() {
    if (pages.length >= 80) throw new Error("DOCUMENT_PDF_PAGE_LIMIT");
    sheet = original.cloneNode(false) as HTMLElement;
    sheet.classList.add("continuation");
    content = document.createElement("main");
    content.className = "page-content";
    sheet.append(content, footer.cloneNode(true));
    document.body.append(sheet);
    pages.push(sheet);
    contents.push(content);
  }
  function bottom(element: HTMLElement) {
    return (
      (element.getBoundingClientRect().bottom -
        sheet.getBoundingClientRect().top) /
      Number(getComputedStyle(sheet).zoom)
    );
  }
  function fits(element: HTMLElement) {
    // The hotel source has a full-bleed dark last panel, not a white footer gap.
    const boundary =
      pages.length === 1 &&
      !element.classList.contains("split-fragment") &&
      element.offsetHeight <= 300 &&
      element.classList.contains("hotel-policy")
        ? height
        : pages.length === 1 &&
            !element.classList.contains("split-fragment") &&
            element.classList.contains("dinner-terms")
          ? Math.min(height - 36, dinnerFooterBoundary)
          : limit;
    return bottom(element) <= boundary + 0.1;
  }
  function splitText(element: HTMLElement) {
    const text = element.innerText;
    // Preserve all authored destinations and QR images when text itself needs
    // splitting. Their full display text remains in the flowing text above.
    const links = Array.from(
      element.querySelectorAll<HTMLAnchorElement>("a[href]"),
    );
    const supplemental = links.map((link) => {
      const clone = link.cloneNode(true) as HTMLAnchorElement;
      if (!clone.querySelector("svg"))
        clone.textContent = new URL(link.href).hostname;
      return clone;
    });
    element.remove();
    let remaining = text;
    while (remaining.length) {
      const fragment = document.createElement("section");
      fragment.className = "unit card continued-card overflow-text";
      content.append(fragment);
      let lo = 0;
      let hi = remaining.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        fragment.textContent = remaining.slice(0, mid);
        if (fits(fragment)) lo = mid;
        else hi = mid - 1;
      }
      if (lo === 0) {
        fragment.remove();
        if (!content.children.length)
          throw new Error("DOCUMENT_PDF_UNBREAKABLE_CONTENT");
        newPage();
        continue;
      }
      // Break at whitespace when possible, while consuming every character.
      if (lo < remaining.length) {
        const whitespace = remaining.slice(0, lo).search(/\s+\S*$/);
        if (whitespace > 0) lo = whitespace + 1;
      }
      fragment.textContent = remaining.slice(0, lo);
      remaining = remaining.slice(lo);
      if (remaining) newPage();
    }
    if (supplemental.length) {
      const panel = document.createElement("section");
      panel.className = "unit card continued-card";
      for (const link of supplemental) {
        const row = document.createElement("p");
        row.append(link);
        panel.append(row);
      }
      place(panel);
    }
  }
  function place(element: HTMLElement) {
    if (element.dataset.anchor && pages.length === 1) {
      content.append(element);
      const naturalTop = bottom(element) - element.offsetHeight;
      const delta = Math.max(0, Number(element.dataset.anchor) - naturalTop);
      const priorMargin = element.previousElementSibling
        ? parseFloat(
            getComputedStyle(element.previousElementSibling).marginBottom,
          )
        : 0;
      element.style.marginTop = `${delta ? priorMargin + delta : 0}px`;
    } else content.append(element);
    if (fits(element)) return;
    element.style.marginTop = "0";
    // Small blocks move intact to the next page. Oversized columns are stacked.
    const unitHeight = element.offsetHeight;
    if (unitHeight <= limit - 42 && content.children.length > 1) {
      element.remove();
      newPage();
      content.append(element);
      if (fits(element)) return;
    }
    if (element.hasAttribute("data-columns")) {
      const columns = Array.from(element.children) as HTMLElement[];
      element.remove();
      for (const column of columns) {
        column.classList.add("unit");
        place(column);
      }
      return;
    }
    const inner = element.querySelector<HTMLElement>(".split-content");
    if (inner && inner.children.length > 1) {
      const children = Array.from(inner.children) as HTMLElement[];
      element.remove();
      for (const child of children) {
        const fragment = element.cloneNode(true) as HTMLElement;
        fragment.classList.add("split-fragment");
        fragment.removeAttribute("data-split");
        const target = fragment.querySelector<HTMLElement>(".split-content")!;
        target.classList.add("stacked");
        target.replaceChildren(child);
        place(fragment);
      }
      return;
    }
    // A single arbitrarily long paragraph/name/reference can exceed a page.
    // Measured plain-text continuation is safer than clipped nested print grids.
    splitText(element);
  }
  for (const element of source) place(element);
  for (const [index, page] of pages.entries()) {
    const pageNumber = page.querySelector(".page-number");
    if (pageNumber)
      pageNumber.textContent = `${index + 1} / ${pages.length}`;
    if (index > 0 && document.body.classList.contains("hotel")) {
      (page.querySelector(".footer") as HTMLElement).style.cssText =
        "background:white;color:#5d7377;bottom:17px";
    }
  }
  return {
    pages: pages.length,
    heights: contents.map((item) => item.offsetHeight),
  };
}
