// Highlight difficult words and provide transcript to the extension

// Extract transcript text from the current page
function extractTranscript() {
  const nodes = document.querySelectorAll(
    'div[class^="NoteDetailSttListItem_organism_text__"] .ProseMirror'
  );
  if (!nodes.length) return '';
  return Array.from(nodes)
    .map((el) => el.textContent.trim())
    .join('\n');
}

// Highlight long English words and attach definitions
function highlightDifficultWords() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  const difficult = new Set();
  nodes.forEach((node) => {
    const parts = node.nodeValue.split(/(\b)/);
    if (!parts.some((p) => /[A-Za-z]{8,}/.test(p))) return;
    const frag = document.createDocumentFragment();
    parts.forEach((p) => {
      if (/[A-Za-z]{8,}/.test(p)) {
        const span = document.createElement('span');
        span.textContent = p;
        span.className = 'clova-ext-difficult-word';
        span.dataset.word = p.toLowerCase();
        span.title = '...';
        span.style.textDecoration = 'underline dotted';
        frag.appendChild(span);
        difficult.add(p.toLowerCase());
      } else {
        frag.appendChild(document.createTextNode(p));
      }
    });
    node.parentNode.replaceChild(frag, node);
  });

  difficult.forEach((word) => {
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
      .then((r) => r.json())
      .then((data) => {
        const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition || 'No definition';
        document.querySelectorAll(`span.clova-ext-difficult-word[data-word="${word}"]`).forEach((el) => {
          el.title = def;
        });
      })
      .catch(() => {
        document.querySelectorAll(`span.clova-ext-difficult-word[data-word="${word}"]`).forEach((el) => {
          el.title = 'No definition';
        });
      });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', highlightDifficultWords);
} else {
  highlightDifficultWords();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_TRANSCRIPT') {
    try {
      const transcript = extractTranscript();
      sendResponse({ transcript });
    } catch (e) {
      sendResponse({ transcript: '' });
    }
  }
});
