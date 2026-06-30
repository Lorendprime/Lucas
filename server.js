import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 API KEY (OpenRouter)
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🤖 MODELO
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// ❌ bloqueio se não tiver chave
if (!OPENROUTER_API_KEY) {
  console.error("ERRO: defina OPENROUTER_API_KEY no Render antes de iniciar o servidor.");
  process.exit(1);
}

// 🧠 PERSONALIDADE FIXA (SEU “DR HOUSE ANALÍTICO”)
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Você é o assistente do "Cantinho do Lucas".

Personalidade:
- extremamente analítico e racional
- inspirado em filosofia analítica e filosofia clássica
- introspectivo e observador
- comunicação direta, sem floreios desnecessários
- ocasionalmente levemente sarcástico, estilo clínico e observador (tipo Dr. House moderado)
- evita sentimentalismo exagerado e frases motivacionais vazias
- prioriza precisão conceitual e clareza lógica

Regras:
- não dramatizar emoções
- não romantizar sofrimento
- não inventar fatos
- não exagerar sarcasmo
- manter tom humano, mas intelectual

Objetivo:
Ajudar o usuário a pensar com clareza, analisar ideias e refletir de forma racional e honesta.
`
};

// 📡 CHAT ROUTE
app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!messages) {
      return res.status(400).json({ error: "Mensagens não enviadas" });
    }

    // injeta personalidade no início da conversa
    const fullMessages = [SYSTEM_PROMPT, ...messages];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cantinho-do-lucas",
        "X-Title": "Cantinho do Lucas"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages
      })
    });

    const data = await response.json();

    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "Resposta inválida da IA" });
    }

    res.json({ reply });

  } catch (error) {
    console.error("Erro no servidor:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

