/**
 * Scrolls to an element by anchor ID or selector with smooth behavior
 * @param anchor - Anchor ID (with or without #) or CSS selector
 * @param options - Scroll behavior options
 * @returns true if element was found and scrolled, false otherwise
 */
export function scrollToAnchor(
  anchor: string,
  options?: {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    inline?: ScrollLogicalPosition;
    offset?: number;
  },
): boolean {
  if (typeof window === 'undefined') return false;

  // Remove leading # if present
  const cleanAnchor = anchor.startsWith('#') ? anchor.slice(1) : anchor;

  // Try to find element by ID first
  let element: HTMLElement | null = document.getElementById(cleanAnchor);

  // If not found by ID, try as CSS selector
  if (!element) {
    element = document.querySelector(cleanAnchor) as HTMLElement | null;
  }

  if (!element) {
    console.warn(`Element not found for anchor: ${anchor}`);
    return false;
  }

  const scrollOptions: ScrollIntoViewOptions = {
    behavior: options?.behavior || 'smooth',
    block: options?.block || 'start',
    inline: options?.inline || 'nearest',
  };

  // Apply offset if specified
  if (options?.offset) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition =
      elementPosition + window.pageYOffset - options.offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: scrollOptions.behavior,
    });
  } else {
    element.scrollIntoView(scrollOptions);
  }

  // Update URL hash without triggering scroll
  window.history.replaceState(null, '', `#${cleanAnchor}`);

  return true;
}
