async function getApiKey() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['openaiKey'], (result) => {
      resolve(result.openaiKey || '');
    });
  });
}

async function saveApiKey(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ openaiKey: key }, resolve);
  });
}

async function getTranscript() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_TRANSCRIPT' }, (res) => {
      resolve(res && res.transcript ? res.transcript : '');
    });
  });
}

async function callChatGPT(apiKey, transcript) {
  const prompt = `You are an assistant that summarizes meeting transcripts. Summarize the following transcript, then provide a TODO list and a possible schedule.\n\n${transcript}`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }]
    })
  });
  const data = await response.json();
  return data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : 'No response';
}

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const result = document.getElementById('result');
  apiKeyInput.value = await getApiKey();

  document.getElementById('saveKey').addEventListener('click', async () => {
    await saveApiKey(apiKeyInput.value);
    result.textContent = 'API key saved.';
  });

  document.getElementById('summarize').addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      result.textContent = 'Please enter API key.';
      return;
    }
    await saveApiKey(key);
    result.textContent = 'Extracting transcript...';
    const transcript = await getTranscript();
    if (!transcript) {
      result.textContent = 'Transcript not found.';
      return;
    }
    result.textContent = 'Contacting ChatGPT...';
    try {
      const summary = await callChatGPT(key, transcript);
      result.textContent = summary;
    } catch (e) {
      result.textContent = 'Error: ' + e.message;
    }
  });
});
