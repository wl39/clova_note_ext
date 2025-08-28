# Clova Note Summarizer Extension

Chrome extension that reads the transcript from a [Naver Clova Note](https://clovanote.naver.com/) page,
uses the ChatGPT API to summarize it, and returns a TODO list and schedule.

## Setup

1. Obtain an OpenAI API key from [https://platform.openai.com](https://platform.openai.com).
2. Clone this repository and load the extension in Chrome:
   - Open `chrome://extensions`.
   - Enable **Developer mode**.
   - Click **Load unpacked** and select this folder.
3. Click the extension icon, enter your API key, and press **Save Key**.

## Usage

1. Open a Clova Note page that contains the transcription.
2. Click the extension icon and press **Summarize & Plan**.
3. The popup displays a summary along with a list of tasks and a proposed schedule.

The transcript selector in `content.js` is generic and may need to be
adjusted if the page structure changes.
