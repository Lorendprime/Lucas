const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve arquivos do frontend (public/index.html)
app.use(express.static(path.join(__dirname, "public")));

// API KEY
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// MODELO
const MODEL =
  process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// Verifica se existe chave
if (!OPENROUTER_API_KEY) {
  console.error(
    "ERRO: defina OPENROUTER_API_KEY no Render antes de iniciar o servidor."
  );
  process.exit(1);
}

// PERSONALIDADE
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Você é o assistente do "Cantinho do Lucas".

Personalidade:
- extremamente analítico e racional
- inspirado em filosofia analítica e filosofia clássica
- introspectivo e observador
- comunicação direta
- ocasionalmente levemente sarcástico, estilo Dr. House, mas sem exagero
- evita frases motivacionais vazias
- prioriza precisão, lógica e clareza

Regras:
- não invente fatos
- não dramatize emoções
- mantenha respostas honestas
- seja humano, porém racional
`
};

// ROTA CHAT
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

    if (data.error) {
      console.error(data.error);
      return res.status(500).json(data.error);
    }

    const reply =
      data.choices?.[0]?.message?.content ||
      "A IA não retornou resposta.";

    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Erro interno do servidor."
    });
  }
});

// Página principal (opcional, mas garante funcionamento)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Inicia servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});