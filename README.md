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

---

## Installing the browser extension

The extension lives in the `public` folder and can be loaded in Chrome (or any Chromium-based browser, e.g. Edge, Brave) as an **unpacked** extension.

### Prerequisites

- **Chrome** or a Chromium-based browser (Edge, Brave, etc.)
- This repo cloned (and optionally the Next.js backend running for full functionality)

### Step 1: Get the extension files

Clone the repo and open the project folder:

```bash
git clone <your-repo-url>
cd browser-flo
```

The extension files are in **`public/`**:

- `manifest.json` – extension manifest (Manifest v3)
- `service-worker.js` – background script
- `popup.html` / `popup.js` – popup UI
- `content-script.js` – content script

No build step is required for the extension; use the `public` folder as-is.

### Step 2: Load the extension in Chrome

1. Open Chrome and go to **`chrome://extensions`**.
2. Turn **Developer mode** on (toggle in the top-right).
3. Click **“Load unpacked”**.
4. In the file picker, select the **`public`** folder inside this project (e.g. `browser-flo/public`), then confirm.

Chrome will load the extension and show **Browser Flow** in your extensions list and in the toolbar.

### Step 3: Run the backend (for full functionality)

The extension talks to the Next.js API. For local use:

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`. The extension is already configured to use this URL for the tasks API.

### Using a deployed backend (production)

Point the extension at **this Next.js app’s URL** (where this repo is deployed), not at a separate FastAPI backend. On the Next.js deployment, set `BROWSER_FLO_BACKEND_URL` to your FastAPI backend (e.g. `https://browser-flow-backend.onrender.com`).

```bash
node scripts/update-service-worker-url.js https://your-nextjs-app.vercel.app
```

Then in **`chrome://extensions`**, click the **reload** icon on the Browser Flow extension so it picks up the updated `service-worker.js`.

### Troubleshooting

| Issue | What to do |
|-------|------------|
| Extension doesn’t appear | Ensure you selected the **`public`** folder (the one that contains `manifest.json`), not the project root. |
| “Send URL to backend” does nothing | Make sure the Next.js dev server is running (`npm run dev`) or that you’ve run `update-service-worker-url.js` for your deployed URL and reloaded the extension. |
| Popup is blank or errors | Open **`chrome://extensions`**, find Browser Flow, click “Inspect views: popup.html” and check the console for errors. |
| Permission or install errors | Confirm `public/manifest.json` is valid and that all referenced files (`service-worker.js`, `popup.html`, `content-script.js`) exist in `public/`. |
| **Extension still fails after update-service-worker-url** | The extension must call **this Next.js app** (this repo), not your FastAPI backend. If `https://browser-flow-backend.onrender.com` is your **FastAPI** service: (1) Deploy **this Next.js app** elsewhere (e.g. Vercel or another Render service). (2) Set `BROWSER_FLO_BACKEND_URL=https://browser-flow-backend.onrender.com` on that deployment. (3) Run `update-service-worker-url.js` with **that Next.js URL** (not the FastAPI URL), then reload the extension. This app includes CORS so the extension can call it. |
| **502 or 503 when extension calls Vercel app** | The Next.js app on Vercel proxies to your FastAPI backend. You **must** set the env var **`BROWSER_FLO_BACKEND_URL`** in Vercel (Project → Settings → Environment Variables) to your FastAPI backend URL (e.g. `https://browser-flow-backend.onrender.com`). Without it, the app tries to call `http://localhost:8000` and fails. Redeploy after adding the variable. |
| First request very slow (Render) | On Render free tier the service can spin down; the first request after idle may take 30–60 seconds. |

---

### Running the Next.js app

- **Install dependencies**:

```bash
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

### Using the extension

- With the Next.js dev server running:
  - Click the **Browser Flow** icon in the toolbar.
  - In the popup:
    - Choose a **task type** (e.g. "Create note from this page").
    - Click **"Send URL to backend"**.
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

