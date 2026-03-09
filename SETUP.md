# What You Need To Do (So Everything Works)

Follow these steps **once** so the Work section and Claude integration work.

---

## 1. Get an Anthropic API key

- Go to [console.anthropic.com](https://console.anthropic.com/) and sign in (or create an account).
- Open **API Keys** and create a new key.
- Copy the key (it starts with `sk-ant-`). You won’t be able to see it again.

---

## 2. Add your API key to the project

In the **root** of this repo (same folder as `package.json`):

1. Create a file named **`.env`** (no filename before the dot).
2. Put this in it, with your real key:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
```

3. Save the file.  
   **Important:** `.env` is in `.gitignore` so it never gets committed. Don’t put this key in any other file or in GitHub.

---

## 3. Install dependencies and run the app

From the project root:

```bash
npm install
```

Then you need **two** processes running:

**Terminal 1 – frontend**

```bash
npm run dev
```

**Terminal 2 – backend (Claude API)**

```bash
npm run server
```

- Frontend: [http://localhost:5173](http://localhost:5173)  
- Backend: [http://localhost:3001](http://localhost:3001) (used by the frontend via proxy; you don’t open it in a browser)

Leave both terminals running while you use the app. The Work section will call the backend, which uses your API key to talk to Claude.

---

## 4. Optional: run frontend and backend with one command

If you prefer a single command:

```bash
npm run dev:all
```

That starts both the Vite dev server and the API server. You’ll see logs from both in the same terminal.

---

## Checklist

- [ ] Anthropic API key created at [console.anthropic.com](https://console.anthropic.com/)
- [ ] `.env` file created in project root with `ANTHROPIC_API_KEY=sk-ant-...`
- [ ] `npm install` run
- [ ] Both `npm run dev` and `npm run server` running (or `npm run dev:all`)

Once that’s done, the Work section can use Watson (Claude) for the conversation and for generating the output.

If the API returns a **model not found** error, edit `server/index.js` and change the `model` in the `client.messages.create` calls to a current model id (e.g. `claude-sonnet-4` or the latest from [Anthropic’s models page](https://docs.anthropic.com/en/docs/models-overview)).

---

## Deploying later (e.g. Vercel)

- The **frontend** can be deployed as a static site (Vite build) as you do now.
- The **backend** must run somewhere that can hold `ANTHROPIC_API_KEY` securely (e.g. Vercel serverless functions, a small Node host, or Supabase Edge Functions). Set `ANTHROPIC_API_KEY` in that environment’s config (e.g. Vercel → Project → Settings → Environment Variables), and point the frontend’s API base URL to that backend. We can wire that when you’re ready to deploy.
