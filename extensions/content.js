chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "AEGIS_FIND_QR") {
    return false;
  }

  const candidates = [];
  const selector = [
    "img[src*='qr' i]",
    "img[alt*='qr' i]",
    "img[title*='qr' i]",
    "a[href*='qr' i]",
    "canvas",
    "svg"
  ].join(",");

  document.querySelectorAll(selector).forEach((node) => {
    const value = node.currentSrc || node.src || node.href || node.getAttribute("aria-label") || "";
    const label = node.alt || node.title || node.textContent || node.tagName;

    if (value || /qr|scan|code/i.test(label)) {
      candidates.push({
        source: label.trim().slice(0, 80) || node.tagName,
        value: value || label.trim().slice(0, 240)
      });
    }
  });

  const pageTextMatch = document.body?.innerText?.match(/https?:\/\/\S{8,}/i);
  if (!candidates.length && pageTextMatch) {
    candidates.push({
      source: "Page text URL",
      value: pageTextMatch[0]
    });
  }

  sendResponse({ candidates: candidates.slice(0, 8) });
  return true;
});
