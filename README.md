## Browser Flow – Next.js-powered browser extension backend

**Browser Flow** is a Next.js app plus a Chrome Extension that work together to:

- **Capture the current tab URL**
- **Send it to a backend API** with a chosen task type:
  - `create_note`
  - `create_action_items`
  - `add_to_context`
  - `reason_about_page`
  - `extract_data`
- **Wait for the task to complete** (simulated in this repo)
- **Notify the user** via a browser notification

### Running the Next.js app

- **Install dependencies**:

```bash
cd /Users/ratikesh/browser-flow
npm install
```

- **Start the dev server**:

```bash
npm run dev
```

This will run Next.js on `http://localhost:3000`.

The extension’s background script is configured (for local development) to call:

- `http://localhost:3000/api/tasks` – **POST** to create a task
- `http://localhost:3000/api/tasks?id=TASK_ID` – **GET** to poll task status

The route implementation lives in `app/api/tasks/route.ts`.

### Loading the extension in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **“Load unpacked”**.
4. Select the `public` folder of this project:
   - `/Users/ratikesh/browser-flow/public`

Chrome will read `manifest.json` from that folder and register the extension.

### Using the extension

- With the Next.js dev server running:
  - Click the **Browser Flow** icon in the toolbar.
  - In the popup:
    - Choose a **task type** (e.g. “Create note from this page”).
    - Click **“Send URL to backend”**.
  - The extension:
    - Reads the **active tab URL**.
    - Calls `http://localhost:3000/api/tasks` with `{ url, taskType, metadata }`.
    - Polls `/api/tasks?id=...` until the task is **completed**.
    - Shows a **Chrome notification** when done.

### Where to plug in your real backend

- The current implementation simulates work in-memory in:
  - `app/api/tasks/route.ts`
- To integrate a real backend:
  - Replace the in-memory `tasks` map and `simulateExternalProcessing` with calls to your own service.
  - Or change `public/service-worker.js` to call your external API instead of `http://localhost:3000/api/tasks`.

### Files of interest

- **Next.js app**
  - `app/page.tsx` – small control panel / landing page
  - `app/api/tasks/route.ts` – task creation and status polling API
- **Chrome Extension**
  - `public/manifest.json` – MV3 manifest
  - `public/service-worker.js` – background script that talks to the Next.js API and shows notifications
  - `public/popup.html` – popup UI for choosing the task and sending the URL
  - `public/content-script.js` – placeholder content script (ready for future DOM scraping, etc.)

