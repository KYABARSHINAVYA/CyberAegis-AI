chrome.runtime.onInstalled.addListener(() => {
  console.log("AegisShield AI extension installed");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "AEGIS_NOTIFY") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.svg",
      title: message.title || "AegisShield AI",
      message: message.message || "Threat detected."
    });
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "AEGIS_OPEN_TELEGRAM") {
    const url = `https://t.me/share/url?text=${encodeURIComponent(message.text || "")}`;
    chrome.tabs.create({ url });
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "AEGIS_OPEN_THREAT_CENTER") {
    chrome.tabs.create({ url: message.url || "http://localhost:5173/dashboard" });
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
