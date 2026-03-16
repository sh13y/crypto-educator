require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/public')));

// =============================================
// CRYPTO PRICE API (CoinGecko - 100% FREE)
// =============================================
const COINS = {
  btc: 'bitcoin',
  eth: 'ethereum',
  bnb: 'binancecoin'
};

// GET /api/prices - Live prices for BTC, ETH, BNB
app.get('/api/prices', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'bitcoin,ethereum,binancecoin',
          vs_currencies: 'usd',
          include_24hr_change: true,
          include_24hr_vol: true,
          include_market_cap: true
        },
        timeout: 10000
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Price fetch error:', error.message);
    // Return mock data if API fails
    res.json({
      success: true,
      data: {
        bitcoin: { usd: 67420, usd_24h_change: 2.4, usd_market_cap: 1320000000000 },
        ethereum: { usd: 3521, usd_24h_change: 1.8, usd_market_cap: 420000000000 },
        binancecoin: { usd: 412, usd_24h_change: -0.5, usd_market_cap: 62000000000 }
      },
      mock: true
    });
  }
});

// GET /api/chart/:coin - Historical chart data (7 days)
app.get('/api/chart/:coin', async (req, res) => {
  const { coin } = req.params;
  const days = req.query.days || 7;
  const coinId = COINS[coin.toLowerCase()] || coin;
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
      {
        params: { vs_currency: 'usd', days },
        timeout: 10000
      }
    );
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Chart fetch error:', error.message);
    // Generate mock chart data
    const mockPrices = [];
    const basePrice = coin === 'btc' ? 65000 : coin === 'eth' ? 3400 : 400;
    const now = Date.now();
    for (let i = Number(days); i >= 0; i--) {
      const time = now - i * 24 * 60 * 60 * 1000;
      const price = basePrice + (Math.random() - 0.5) * basePrice * 0.1;
      mockPrices.push([time, price]);
    }
    res.json({ success: true, data: { prices: mockPrices }, mock: true });
  }
});

// GET /api/dca/:coin - DCA Calculator Data
app.get('/api/dca/:coin', async (req, res) => {
  const { coin } = req.params;
  const { amount = 100, frequency = 'weekly', months = 6 } = req.query;
  const coinId = COINS[coin.toLowerCase()] || coin;

  try {
    // Fetch historical daily prices
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
      { params: { vs_currency: 'usd', days: months * 30 }, timeout: 10000 }
    );

    const prices = response.data.prices;
    const investmentAmount = parseFloat(amount);
    
    // Calculate DCA results
    let totalInvested = 0;
    let totalCoins = 0;
    const dcaEntries = [];
    
    const intervalDays = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30;
    
    for (let i = 0; i < prices.length; i += intervalDays * 24) {
      const idx = Math.min(i, prices.length - 1);
      const price = prices[idx][1];
      const coinsAcquired = investmentAmount / price;
      totalInvested += investmentAmount;
      totalCoins += coinsAcquired;
      dcaEntries.push({
        date: new Date(prices[idx][0]).toLocaleDateString(),
        price: price.toFixed(2),
        coinsAcquired: coinsAcquired.toFixed(6),
        totalCoins: totalCoins.toFixed(6)
      });
    }

    const currentPrice = prices[prices.length - 1][1];
    const currentValue = totalCoins * currentPrice;
    const profitLoss = currentValue - totalInvested;
    const roi = ((profitLoss / totalInvested) * 100).toFixed(2);

    res.json({
      success: true,
      data: {
        summary: {
          totalInvested: totalInvested.toFixed(2),
          totalCoins: totalCoins.toFixed(6),
          currentValue: currentValue.toFixed(2),
          profitLoss: profitLoss.toFixed(2),
          roi,
          avgBuyPrice: (totalInvested / totalCoins).toFixed(2),
          currentPrice: currentPrice.toFixed(2)
        },
        entries: dcaEntries.slice(-10)
      }
    });
  } catch (error) {
    console.error('DCA error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to calculate DCA' });
  }
});

// GET /api/trending - Trending coins
app.get('/api/trending', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/search/trending',
      { timeout: 10000 }
    );
    const trending = response.data.coins.slice(0, 6).map(c => ({
      name: c.item.name,
      symbol: c.item.symbol,
      rank: c.item.market_cap_rank,
      thumb: c.item.thumb,
      priceChange: c.item.data?.price_change_percentage_24h?.usd?.toFixed(2) || 'N/A'
    }));
    res.json({ success: true, data: trending });
  } catch (error) {
    console.error('Trending error:', error.message);
    res.json({
      success: true,
      data: [
        { name: 'Bitcoin', symbol: 'BTC', rank: 1, priceChange: '2.4' },
        { name: 'Ethereum', symbol: 'ETH', rank: 2, priceChange: '1.8' },
        { name: 'BNB', symbol: 'BNB', rank: 4, priceChange: '-0.5' }
      ],
      mock: true
    });
  }
});

// =============================================
// AI CHAT API - Using Groq (FREE) or OpenRouter
// =============================================

// System prompt for crypto educator
const CRYPTO_SYSTEM_PROMPT = `You are Openclaw AI Crypto Educator, an expert cryptocurrency educator specializing in:
- Bitcoin (BTC), Ethereum (ETH), and BNB (Binance Coin)
- Blockchain technology fundamentals
- DCA (Dollar Cost Averaging) investment strategies
- Crypto market trends and analysis
- Risk management in crypto investing

Your teaching style:
- Use simple, clear language with real-world examples
- Always mention risks when discussing investments
- Provide balanced perspectives (bullish and bearish)
- Use emojis occasionally to make learning fun
- Break down complex concepts into digestible parts
- When asked about prices, remind users to always DYOR (Do Your Own Research)
- Never give direct financial advice, always educate

Key knowledge areas:
1. BTC: Digital gold, store of value, halving cycles, Lightning Network
2. ETH: Smart contracts, DeFi, NFTs, Proof of Stake, gas fees
3. BNB: Binance ecosystem, BEP-20 tokens, BSC, use cases
4. Blockchain: Decentralization, consensus mechanisms, wallets, keys
5. DCA: How it works, benefits, risks, real examples
6. Market trends: Bull/bear cycles, market cap, dominance, FOMO/FUD

Always end responses with a learning tip or fun fact about crypto!`;

// POST /api/chat - AI Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  const messages = [
    ...history.slice(-6), // Keep last 6 messages for context
    { role: 'user', content: message }
  ];

  // Try Groq first (FREE - 6000 tokens/min free tier)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant', // FREE model on Groq
          messages: [{ role: 'system', content: CRYPTO_SYSTEM_PROMPT }, ...messages],
          max_tokens: 800,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      return res.json({
        success: true,
        reply: response.data.choices[0].message.content,
        model: 'llama-3.1-8b (Groq Free)'
      });
    } catch (err) {
      console.error('Groq error:', err.response?.data || err.message);
    }
  }

  // Try OpenRouter (FREE models available)
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.1-8b-instruct:free', // FREE on OpenRouter
          messages: [{ role: 'system', content: CRYPTO_SYSTEM_PROMPT }, ...messages],
          max_tokens: 800
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'CryptoEducator'
          },
          timeout: 30000
        }
      );
      return res.json({
        success: true,
        reply: response.data.choices[0].message.content,
        model: 'Llama 3.1 (OpenRouter Free)'
      });
    } catch (err) {
      console.error('OpenRouter error:', err.response?.data || err.message);
    }
  }

  // Fallback: Smart rule-based responses (works without any API key!)
  const fallbackReply = getFallbackResponse(message);
  res.json({
    success: true,
    reply: fallbackReply,
    model: 'Openclaw AI Built-in (No API key needed)',
    isFallback: true
  });
});

// Smart fallback responses - works without any API key
function getFallbackResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('dca') || msg.includes('dollar cost')) {
    return `## 📊 Dollar Cost Averaging (DCA) Explained!\n\nDCA is one of the smartest strategies for crypto beginners!\n\n**How it works:**\n- Instead of investing all at once, you invest a FIXED amount at regular intervals\n- Example: $100 every week into Bitcoin, regardless of price\n\n**Why DCA works:**\n✅ Removes emotion from investing\n✅ Automatically buy more when prices are LOW\n✅ Reduces impact of market volatility\n✅ No need to time the market\n\n**DCA Example:**\n- Week 1: BTC at $60,000 → Buy 0.00167 BTC\n- Week 2: BTC at $50,000 → Buy 0.002 BTC (more!)\n- Week 3: BTC at $70,000 → Buy 0.00143 BTC\n\nAverage cost = $60,000 (better than buying all at $70k!)\n\n💡 **Fun Fact:** Studies show DCA outperforms lump-sum investing in volatile markets 2/3 of the time!`;
  }

  if (msg.includes('bitcoin') || msg.includes('btc')) {
    return `## ₿ Bitcoin (BTC) - The King of Crypto!\n\n**What is Bitcoin?**\nBitcoin is the world's first decentralized digital currency, created by the mysterious Satoshi Nakamoto in 2009.\n\n**Key Facts:**\n🔢 Max Supply: 21 million BTC (ever!)\n⛏️ Mining: New BTC created every ~10 minutes\n📅 Halving: Every 4 years, mining reward cuts in half\n🌐 Network: Most secure blockchain on Earth\n\n**Why Bitcoin matters:**\n- "Digital Gold" - store of value\n- Hedge against inflation\n- Borderless transactions\n- Not controlled by any government\n\n**Bitcoin Halving Cycle:**\n2012 → 2016 → 2020 → 2024 (next ~2028)\nHistorically, bull runs follow each halving! 🚀\n\n⚠️ **Remember:** Always invest only what you can afford to lose!\n\n💡 **Fun Fact:** The first real-world Bitcoin transaction was 10,000 BTC for 2 pizzas in 2010. Those pizzas are now worth hundreds of millions of dollars! 🍕`;
  }

  if (msg.includes('ethereum') || msg.includes('eth')) {
    return `## Ξ Ethereum (ETH) - The World Computer!\n\n**What is Ethereum?**\nEthereum is a programmable blockchain that enables smart contracts and decentralized applications (dApps).\n\n**Key Features:**\n📝 Smart Contracts: Self-executing code on the blockchain\n🏦 DeFi: Decentralized finance apps (lending, trading)\n🎨 NFTs: Non-fungible tokens\n⛽ Gas Fees: Cost to process transactions\n\n**ETH's Big Upgrade - "The Merge":**\n- Switched from Proof of Work to Proof of Stake (2022)\n- Reduced energy usage by 99.95%! 🌱\n- ETH stakers earn rewards (~4-6% APY)\n\n**ETH vs BTC:**\n| Feature | BTC | ETH |\n|---------|-----|-----|\n| Purpose | Store of Value | Smart Contracts |\n| Supply | 21M max | Unlimited but deflationary |\n| Consensus | PoW | PoS |\n\n💡 **Fun Fact:** Over $50 billion in DeFi value is locked in Ethereum protocols!`;
  }

  if (msg.includes('bnb') || msg.includes('binance')) {
    return `## 🟡 BNB (Binance Coin) - The Exchange Token!\n\n**What is BNB?**\nBNB is the native token of the Binance ecosystem, the world's largest crypto exchange.\n\n**BNB Use Cases:**\n💸 Trading fee discounts on Binance (25% off!)\n⛽ Gas fees on BNB Smart Chain (BSC)\n🎮 Gaming and NFTs in the BNB ecosystem\n🗳️ Governance voting\n🛒 Online purchases with Binance Pay\n\n**BNB Smart Chain (BSC):**\n- Fast: 3-second block times\n- Cheap: Very low transaction fees\n- Compatible: Works with Ethereum tools (MetaMask, etc.)\n\n**BNB Token Burn:**\nBinance burns (destroys) BNB every quarter based on trading volume, reducing supply over time! 🔥\n\n**Ecosystem:**\n- PancakeSwap (DEX)\n- Venus Protocol (DeFi)\n- Thousands of BEP-20 tokens\n\n⚠️ Note: BNB is closely tied to Binance's performance as a company.\n\n💡 **Fun Fact:** BNB launched at $0.10 in 2017. At peak, it reached over $700!`;
  }

  if (msg.includes('blockchain')) {
    return `## ⛓️ Blockchain Technology Explained!\n\n**What is a Blockchain?**\nA blockchain is a distributed ledger - a database shared across thousands of computers worldwide.\n\n**Key Properties:**\n🔒 **Immutable:** Once recorded, data cannot be changed\n🌐 **Decentralized:** No single point of control\n👁️ **Transparent:** Anyone can verify transactions\n🛡️ **Secure:** Cryptographically protected\n\n**How a Block is Created:**\n1. Transaction is initiated\n2. Transaction broadcasted to network\n3. Miners/Validators verify it\n4. Transaction added to a block\n5. Block added to the chain\n6. Transaction complete! ✅\n\n**Consensus Mechanisms:**\n⛏️ **Proof of Work (PoW):** Miners solve puzzles (Bitcoin)\n🥩 **Proof of Stake (PoS):** Validators lock up crypto (Ethereum)\n\n**Real World Uses:**\n- Cryptocurrency payments\n- Supply chain tracking\n- Digital identity\n- Voting systems\n- Medical records\n\n💡 **Fun Fact:** The Bitcoin blockchain has NEVER been hacked since its creation in 2009!`;
  }

  if (msg.includes('wallet') || msg.includes('key')) {
    return `## 🔐 Crypto Wallets & Keys Explained!\n\n**Types of Wallets:**\n\n🌐 **Hot Wallets** (Connected to internet)\n- MetaMask, Trust Wallet, Coinbase Wallet\n- Convenient but less secure\n- Best for small amounts / daily use\n\n❄️ **Cold Wallets** (Offline)\n- Ledger, Trezor hardware wallets\n- Most secure option\n- Best for long-term storage\n\n**Public vs Private Keys:**\n🔑 **Public Key** = Your bank account number (share freely)\n🔐 **Private Key** = Your PIN (NEVER share!)\n\n**Seed Phrase (Recovery Phrase):**\n- 12 or 24 random words\n- Master key to ALL your wallets\n- Store offline on paper or metal\n- NEVER store digitally or share online!\n\n**Golden Rules:**\n✅ Not your keys, not your coins\n✅ Always backup your seed phrase\n✅ Use hardware wallet for large amounts\n❌ Never share private keys or seed phrase\n❌ Never store seed phrase in photos or cloud\n\n💡 **Fun Fact:** An estimated 3-4 million BTC (worth billions!) are permanently lost due to forgotten passwords and lost keys!`;
  }

  if (msg.includes('trend') || msg.includes('bull') || msg.includes('bear')) {
    return `## 📈 Crypto Market Trends Explained!\n\n**Bull Market vs Bear Market:**\n🐂 **Bull Market:** Prices rising, optimism high, FOMO everywhere\n🐻 **Bear Market:** Prices falling 20%+, fear dominant, "crypto is dead" headlines\n\n**Key Market Indicators:**\n📊 **Market Dominance:** BTC usually leads - high BTC dominance = alt coins underperform\n💰 **Total Market Cap:** Overall health indicator\n😨 **Fear & Greed Index:** 0 = Extreme Fear, 100 = Extreme Greed\n📉 **Volume:** High volume confirms trends\n\n**Bitcoin's Historical Cycles:**\n| Year | Event | Price |\n|------|-------|-------|\n| 2017 | Bull Run | $20K ATH |\n| 2018-2019 | Bear Market | -84% |\n| 2020-2021 | Bull Run | $69K ATH |\n| 2022 | Bear Market | -77% |\n| 2024+ | New Cycle? | ??? |\n\n**Smart Trend Strategies:**\n✅ Don't panic sell in bear markets\n✅ Don't FOMO buy at all-time highs\n✅ DCA removes the need to time markets\n✅ Zoom out - crypto always long-term trended up\n\n💡 **Fun Fact:** Every BTC bear market low was HIGHER than the previous cycle's low!`;
  }

  if (msg.includes('risk') || msg.includes('safe') || msg.includes('beginner')) {
    return `## 🛡️ Crypto Risk Management for Beginners!\n\n**Golden Rules:**\n1. 💸 Only invest what you can afford to LOSE COMPLETELY\n2. 📚 DYOR - Do Your Own Research always\n3. 🥚 Don't put all eggs in one basket\n4. 📅 Think long-term (3-5 year horizon minimum)\n5. 🧘 Don't check prices every hour - it creates anxiety!\n\n**Risk Levels:**\n🟢 Low Risk: BTC, ETH (top coins)\n🟡 Medium Risk: BNB, top 20 coins\n🔴 High Risk: Small altcoins, memecoins\n🚨 Extreme Risk: Leverage trading, new unknown tokens\n\n**Beginner Portfolio Example:**\n- 50% Bitcoin (BTC)\n- 30% Ethereum (ETH)\n- 20% BNB or stablecoins\n\n**Red Flags to Avoid:**\n❌ "Guaranteed returns" promises\n❌ Pump & dump groups\n❌ Influencers promising 100x\n❌ Unknown tokens from random DMs\n❌ Leverage/margin trading as a beginner\n\n**Good Starting Strategy:**\n→ Set up DCA: $50-100/week into BTC + ETH\n→ Use a reputable exchange (Binance, Coinbase)\n→ Withdraw to hardware wallet for amounts over $1000\n\n💡 **Fun Fact:** Simply holding BTC for any 4-year period in its history has ALWAYS been profitable!`;
  }

  // Default response
  return `## 👋 Welcome to Openclaw AI Crypto Educator!\n\nI'm your AI crypto educator! I can teach you about:\n\n₿ **Bitcoin (BTC)** - Digital gold, store of value\nΞ **Ethereum (ETH)** - Smart contracts & DeFi\n🟡 **BNB** - Binance ecosystem token\n⛓️ **Blockchain** - How it all works\n📊 **DCA Strategy** - Smart investing technique\n📈 **Market Trends** - Bull/bear cycles\n🔐 **Wallets & Security** - Keep your crypto safe\n\n**Try asking me:**\n- "What is Bitcoin and why is it valuable?"\n- "Explain DCA investing strategy"\n- "How does blockchain technology work?"\n- "What are the risks of crypto investing?"\n- "Compare BTC vs ETH"\n\nWhat would you like to learn today? 🚀`;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Openclaw AI Crypto Educator running!',
    aiMode: process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here'
      ? 'Groq AI (Live)'
      : process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here'
        ? 'OpenRouter AI (Live)'
        : 'Built-in Openclaw AI (No API Key Required)',
    endpoints: ['/api/prices', '/api/chart/:coin', '/api/dca/:coin', '/api/trending', '/api/chat']
  });
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Openclaw AI Crypto Educator running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🤖 AI Mode: ${
    process.env.GROQ_API_KEY !== 'your_groq_api_key_here'
      ? 'Groq AI Active'
      : 'Built-in Mode (No API key needed!)'
  }\n`);
});
