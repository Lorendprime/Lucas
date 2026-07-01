const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve o frontend (public/index.html)
app.use(express.static(path.join(__dirname, "public")));

// ENV
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// MODELO (mais estável)
const MODEL = "openai/gpt-4o";

// segurança
if (!OPENROUTER_API_KEY) {
  console.error("ERRO: OPENROUTER_API_KEY não definida no Render");
  process.exit(1);
}

// personalidade
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Você é o assistente do "Cantinho do Lucas".

Personalidade:
- racional, analítico e direto
- levemente sarcástico quando necessário
- sem frases vazias
- clareza acima de tudo

Regras:
- não invente fatos
- seja preciso
- respostas curtas e úteis
`
};

// CHAT
app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!messages) {
      return res.status(400).json({ error: "Mensagens não enviadas." });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lucas-6.onrender.com",
        "X-Title": "Cantinho do Lucas"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [SYSTEM_PROMPT, ...messages]
      })
    });

    const data = await response.json();

    // 🔥 ERRO REAL (AGORA VAI APARECER DE VERDADE)
    if (!response.ok) {
      console.error("OPENROUTER ERROR:", data);

      return res.status(500).json({
        error: data.error?.message || JSON.stringify(data)
      });
    }

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("RESPOSTA VAZIA:", data);

      return res.status(500).json({
        error: "IA não retornou resposta válida"
      });
    }

    res.json({ reply });

  } catch (err) {
    console.error("ERRO INTERNO:", err);

    res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
});

// HOME
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// START
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});