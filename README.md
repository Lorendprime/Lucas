# Cantinho do Lucas — backend do chat

Esse backend resolve um problema: o widget de chat da página chamava
`api.anthropic.com` direto do navegador, o que **não funciona fora do
ambiente de artifacts do Claude** (precisa de uma chave de API, que não pode
ficar exposta no código do front-end). Esse servidor guarda a chave com
segurança e repassa as mensagens.

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie o arquivo de exemplo de variáveis de ambiente e preencha com sua chave:
   ```bash
   cp .env.example .env
   ```
   Edite o `.env` e coloque sua chave real da Anthropic em `ANTHROPIC_API_KEY`
   (você consegue uma em https://console.anthropic.com).

3. Inicie o servidor:
   ```bash
   npm start
   ```
   Ele vai subir em `http://localhost:3000`.

4. Sirva o `Cantinho_Lucas.html` (o arquivo do site) de forma que as
   requisições para `/api/chat` cheguem nesse servidor. As duas formas mais
   simples:
   - **Mesmo servidor**: copie o `Cantinho_Lucas.html` para uma pasta
     `public/` e adicione `app.use(express.static('public'))` no `server.js`
     antes do `app.listen(...)`. Aí tudo roda em `http://localhost:3000`.
   - **Servidores separados**: sirva o HTML por outro lugar (Netlify, Vercel,
     etc.) e troque `CHAT_BACKEND_URL` no HTML pela URL pública do backend
     (ex: `https://meu-backend.onrender.com/api/chat`). Nesse caso, ajuste
     `ALLOWED_ORIGIN` no `.env` para o domínio onde o HTML está hospedado.

## Deploy em produção

Qualquer serviço que rode Node.js funciona: Render, Railway, Fly.io, um VPS
próprio, etc. Os passos são sempre os mesmos:
- Defina `ANTHROPIC_API_KEY` como variável de ambiente secreta no painel do
  serviço (nunca no código).
- Defina `ALLOWED_ORIGIN` com o domínio real do seu site.
- Rode `npm install && npm start`.

## Por que isso é necessário

- Chamar a API da Anthropic exige uma chave secreta (`x-api-key`). Se ela
  ficar no HTML/JS do navegador, qualquer visitante pode abrir o "Inspecionar
  elemento" e roubá-la.
- A API da Anthropic também não permite chamadas diretas do navegador (sem
  proxy) por padrão, por motivos de segurança.
- Por isso a chave precisa morar em um servidor que você controla, e o
  front-end só conversa com esse servidor.

## Limites já incluídos

O `server.js` já valida o histórico de mensagens (tamanho máximo, formato)
antes de repassar para a Anthropic, para evitar abuso básico. Se quiser, dá
pra adicionar rate-limiting (ex: pacote `express-rate-limit`) para limitar
quantas mensagens cada IP pode mandar por minuto.
