# 🚀 CryptoSage — Crypto Educator with AI Assistant

A full-stack crypto education platform featuring live prices, DCA calculator, interactive learning, and an AI-powered chatbot.

## 📁 Project Structure

```
crypto-educator/
├── backend/
│   ├── server.js        ← Node.js Express API
│   ├── package.json
│   └── .env             ← Your API keys go here
└── frontend/
    └── public/
        └── index.html   ← Beautiful single-page frontend
```

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📊 Live Prices | Real-time BTC, ETH, BNB prices via CoinGecko |
| 📈 Price Charts | Interactive 7D/30D/90D/1Y historical charts |
| 🧮 DCA Calculator | Calculate real DCA returns for any coin/period |
| 🔥 Trending | Live trending coins from the market |
| 🤖 AI Chat | Crypto educator AI (works FREE without any key!) |
| 📚 Learn Academy | 9 comprehensive crypto topic guides |

## 🛠️ Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd crypto-educator/backend
npm install
```

### Step 2: Configure AI (Optional — works without this!)
Edit `backend/.env`:

**Option A: Groq (FREE — Recommended)**
1. Go to https://console.groq.com
2. Sign up (free) → Create API Key
3. Add to .env: `GROQ_API_KEY=gsk_your_key_here`

**Option B: OpenRouter (FREE models available)**
1. Go to https://openrouter.ai/keys
2. Sign up (free) → Create API Key
3. Add to .env: `OPENROUTER_API_KEY=sk-or-your_key_here`

**No API key?** The built-in CryptoSage responses work great for all major topics!

### Step 3: Start the Server
```bash
cd backend
npm start
```

### Step 4: Open the App
Open your browser → http://localhost:3001

## 🎯 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/prices` | Live BTC, ETH, BNB prices |
| `GET /api/chart/:coin?days=7` | Historical price data |
| `GET /api/dca/:coin?amount=100&frequency=weekly&months=6` | DCA calculator |
| `GET /api/trending` | Trending cryptocurrencies |
| `POST /api/chat` | AI chat (body: { message, history }) |
| `GET /api/health` | Server status & AI mode |

## 💡 Topics Covered

- ₿ **Bitcoin** — Digital gold, halving cycles, use cases
- Ξ **Ethereum** — Smart contracts, DeFi, The Merge
- ◈ **BNB** — Binance ecosystem, BSC, token burns
- ⛓️ **Blockchain** — How it works, consensus mechanisms
- 🔐 **Wallets** — Hot/cold storage, seed phrases, security
- 📊 **DCA Strategy** — Dollar cost averaging with real examples
- 🏦 **DeFi** — Decentralized finance explained
- 📈 **Market Trends** — Bull/bear cycles, key metrics
- ⚠️ **Risk Management** — Safe investing practices

## 🆓 Free APIs Used

- **CoinGecko API** — No key needed, 30 calls/min free
- **Groq API** — Free tier: 6,000 tokens/min with llama-3.1-8b-instant
- **OpenRouter API** — Free models: meta-llama/llama-3.1-8b-instruct:free
- **Built-in responses** — Works with zero API keys!

## 🚧 Troubleshooting

**Port 3001 in use?**
```bash
PORT=3002 npm start
```
Then update `API_BASE` in index.html to `http://localhost:3002`

**CoinGecko rate limited?**
The app automatically falls back to realistic mock data.

**AI not responding?**
Check your API key in .env or use built-in mode (no key needed).
