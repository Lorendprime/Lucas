const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve o front (public/index.html)
app.use(express.static(path.join(__dirname, "public")));

// API KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// MODELO
const MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// segurança
if (!OPENROUTER_API_KEY) {
  console.error("ERRO: faltando OPENROUTER_API_KEY no Render");
  process.exit(1);
}

// personalidade
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Você é o assistente do "Cantinho do Lucas".

Personalidade:
- extremamente analítico e racional
- inspirado em filosofia analítica e clássica
- direto e observador
- leve sarcasmo ocasional estilo House
- evita frases vazias
- prioriza lógica e clareza

Regras:
- não invente fatos
- não dramatize emoções
- seja preciso e honesto
`
};

// CHAT ROUTE
app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!messages) {
      return res.status(400).json({ error: "Mensagens não enviadas." });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
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
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error(data);
      return res.status(500).json({
        error: "Erro ao chamar OpenRouter"
      });
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "Sem resposta da IA.";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
});

// página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// start
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});