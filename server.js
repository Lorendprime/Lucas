// server.js
// Backend simples para o chat do "Cantinho do Lucas".
// Guarda a chave da Anthropic no servidor e repassa as mensagens do widget.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 3000;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
// Lista de origens permitidas a chamar este backend (seu domínio do site).
// Em dev, "*" libera geral; em produção, troque pelo seu domínio real.
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

if (!ANTHROPIC_API_KEY) {
  console.error('ERRO: defina ANTHROPIC_API_KEY no arquivo .env antes de iniciar o servidor.');
  process.exit(1);
}

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static('public'));

// Limite simples de tamanho de histórico, pra evitar abuso/custo alto
const MAX_HISTORY_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;

const SYSTEM_PROMPT = "Você é um assistente acolhedor que conversa com visitantes do \"Cantinho do Lucas\", uma página pessoal com clima introspectivo (tons escuros, chuva, mural de recados). Você não é o dono da página nem finge ser uma pessoa real chamada Lucas — você é apenas um assistente disponível para bater papo, tirar dúvidas sobre como usar a página, ou simplesmente ouvir quem está passando por ali. Responda em português do Brasil, de forma breve, gentil e natural, sem soar robótico. Se perceber sinais de sofrimento intenso, acolha com cuidado e sugira buscar apoio de alguém de confiança ou de um profissional, sem ser alarmista.";

function validateHistory(history) {
  if (!Array.isArray(history)) return null;
  if (history.length === 0 || history.length > MAX_HISTORY_MESSAGES) return null;

  for (const msg of history) {
    if (!msg || typeof msg !== 'object') return null;
    if (msg.role !== 'user' && msg.role !== 'assistant') return null;
    if (typeof msg.content !== 'string') return null;
    if (msg.content.length === 0 || msg.content.length > MAX_MESSAGE_CHARS) return null;
  }
  return history;
}

app.post('/api/chat', async (req, res) => {
  const history = validateHistory(req.body && req.body.history);

  if (!history) {
    return res.status(400).json({ error: 'Histórico de mensagens inválido.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: history
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erro da Anthropic API:', response.status, errText);
      return res.status(502).json({ error: 'Falha ao falar com o modelo.' });
    }

    const data = await response.json();
    const reply = (data.content || [])
      .map(block => (block.type === 'text' ? block.text : ''))
      .filter(Boolean)
      .join('\n') || 'desculpa, não consegui responder agora.';

    res.json({ reply });
  } catch (err) {
    console.error('Erro no proxy do chat:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Servidor do chat rodando em http://localhost:${PORT}`);
});
