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

async function callChatGPT(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

async function summarize(apiKey, transcript) {
  const prompt = `Summarize the following meeting transcript. Provide a summary and a TODO list.\n\n${transcript}`;
  return callChatGPT(apiKey, prompt);
}

async function ask(apiKey, transcript, question) {
  const prompt = `Transcript:\n${transcript}\n\nQuestion: ${question}`;
  return callChatGPT(apiKey, prompt);
}

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const questionInput = document.getElementById('question');
  const result = document.getElementById('result');
  apiKeyInput.value = await getApiKey();

  document.getElementById('saveKey').addEventListener('click', async () => {
    await saveApiKey(apiKeyInput.value);
    result.textContent = 'API key saved.';
  });

  document.getElementById('analyze').addEventListener('click', async () => {
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
    result.textContent = 'Analyzing...';
    try {
      const summary = await summarize(key, transcript);
      result.textContent = summary;
    } catch (e) {
      result.textContent = 'Error: ' + e.message;
    }
  });

  document.getElementById('ask').addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const question = questionInput.value.trim();
    if (!key) {
      result.textContent = 'Please enter API key.';
      return;
    }
    if (!question) {
      result.textContent = 'Please enter a question.';
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
      const answer = await ask(key, transcript, question);
      result.textContent = answer;
    } catch (e) {
      result.textContent = 'Error: ' + e.message;
    }
  });
});
