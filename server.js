// ==============================================
// BOLT CELERON • Sandro Rhilmanelly
// Versão compacta • Multi‑IA • Pronto GitHub + Render
// ==============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORTA = process.env.PORT || 3000;

// 🗝️ CHAVES — SÓ LÊ DO AMBIENTE • NUNCA NO CÓDIGO
const CHAVE_DEEPSEEK = process.env.DEEPSEEK_KEY || "";
const CHAVE_GEMINI   = process.env.GEMINI_API_KEY || "";
const IA_PADRAO      = process.env.DEFAULT_AI || "deepseek";

// 📦 Configuração básica
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 🧠 Funções das duas IAs
async function chamarDeepSeek(texto) {
  if (!CHAVE_DEEPSEEK) throw new Error("Sem chave DeepSeek");
  const res = await axios.post(
    "https://api.deepseek.com/v1/chat/completions",
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: texto }],
      temperature: 0.7
    },
    { headers: { Authorization: `Bearer ${CHAVE_DEEPSEEK}`, "Content-Type": "application/json" } }
  );
  return res.data.choices[0].message.content;
}

async function chamarGemini(texto) {
  if (!CHAVE_GEMINI) throw new Error("Sem chave Gemini");
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash:generateContent?key=${CHAVE_GEMINI}`,
    { contents: [{ parts: [{ text: texto }] }] },
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta";
}

// 🔄 Escolhe ou troca automaticamente
async function responder(texto, qualIA = IA_PADRAO) {
  try {
    if (qualIA === "gemini") return await chamarGemini(texto);
    return await chamarDeepSeek(texto);
  } catch {
    try { return qualIA === "deepseek" ? await chamarGemini(texto) : await chamarDeepSeek(texto); }
    catch { return "⚠️ Ambas as IAs indisponíveis no momento."; }
  }
}

// 📄 Página inicial + painel simples
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt‑BR">
<head><meta charset="UTF‑8"><meta name="viewport" content="width=device‑width,initial‑1.0"><title>Bolt Celeron • Sandro Rhilmanelly</title>
<style>body{font-family:Arial;padding:1rem;max‑width:900px;margin:auto}button,textarea{width:100%;padding:.7rem;margin:.3rem 0;border‑radius:6px;border:1px solid #ccc}button{background:#22c;color:#fff;font‑weight:bold}</style></head>
<body>
<h1>⚡ Bolt Celeron — Multi‑IA</h1>
<p>DeepSeek + Gemini • Compacto • Pronto para celular</p>
<textarea id="pergunta" rows="4" placeholder="Escreva aqui..."></textarea>
<button onclick="enviar()">ENVIAR</button>
<div id="resposta" style="margin‑top:1rem;white‑space:pre‑wrap;background:#f8f9fa;padding:.8rem;border‑radius:6px"></div>
<script>async function enviar(){const t=document.querySelector('#pergunta').value;const r=document.querySelector('#resposta');r.textContent='…';const q=await fetch('/api/chat',{method:'POST',headers:{'Content‑Type':'application/json'},body:JSON.stringify({texto:t})});const d=await q.json();r.textContent=d.resposta||d.erro||'—';}</script>
</body></html>`);
});

// 🚪 Entrada principal da IA
app.post('/api/chat', async (req, res) => {
  try {
    const { texto } = req.body;
    if (!texto) return res.json({erro:"Texto vazio"});
    const respostaFinal = await responder(texto);
    res.json({ id: uuidv4(), resposta: respostaFinal });
  } catch(e) { res.json({ erro: e.message }); }
});

// ▶️ Ligar servidor
app.listen(PORTA, () => {
  console.log(`✅ Bolt Celeron rodando na porta ${PORTA}`);
  console.log(`🔐 Chaves só por variáveis de ambiente — SEM EXPOSIÇÃO`);
});
