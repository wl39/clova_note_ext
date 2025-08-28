// Extract transcript text from the page and respond to extension messages
function extractTranscript() {
  const candidate = document.querySelector('.transcript, .text, .note') || document.body;
  return candidate.innerText;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_TRANSCRIPT') {
    sendResponse({ transcript: extractTranscript() });
  }
});
