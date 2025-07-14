# News API

### Setup

1.  Create `.env` file:
    ```
    GNEWS_API_KEY="YOUR_KEY_HERE"
    ```
2.  Install and run:
    ```bash
    bun add
    bun dev
    ```
    > if you prefer, you can also use `pnpm install && pnpm dev`, `npm install && npm run dev`, or `yarn install && yarn dev` if you have those package managers installed on your machine.

### API

**Endpoint:** `GET /api/articles`

_note: In a real API, we'd add auth middleware to check if the user is logged in. For this demo, we skip that. also this project does not require it_

**Params:** `q`, `max`, `category`, `author`, `from`, `to`

**Example:**

```bash
curl "http://localhost:3000/api/articles?q=AI&max=5"
```
