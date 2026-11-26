# 💍 Luan & Amanda · 09.01.2027

Site de casamento completo, responsivo e sem custo de hospedagem, com confirmação de presença, lista de presentes via Pix, galeria, mural de recados e painel administrativo para os noivos.

**Site no ar:** https://rodrigoppastro.github.io/casamento-luan-amanda/

![Capa do site](img/capa.jpg)

## Funcionalidades

| Para os convidados | Para os noivos (Painel do Casal) |
|---|---|
| Contagem regressiva até a cerimônia | Resumo de confirmados, recusas e pendentes (adultos e crianças) |
| História do casal com linha do tempo | Lista de convidados com busca e filtros |
| Cerimônia e recepção com Google Maps e Waze | Convite e lembrete individuais pelo WhatsApp em 1 clique |
| **Confirmação de presença** por link individual ou nome | Exportação da lista (CSV / Excel) |
| Responsável confirma as crianças | Presentes informados e total arrecadado |
| **Lista de presentes com Pix** (QR Code + copia e cola com valor) | Aprovação de recados e fotos antes de publicar |
| Envio de fotos pelos convidados | QR Code do site para o convite impresso |
| Mural de recados | Aviso por e-mail a cada nova confirmação |
| Perguntas frequentes | |

## Tecnologia

- **Front-end:** HTML, CSS e JavaScript puros, em um único `index.html`, sem build e sem dependências (só `js/qrcode.js` para gerar QR Codes)
- **Back-end:** Google Apps Script + Google Planilhas (`backend/Codigo.gs`), com dados em uma planilha privada dos noivos e fotos no Google Drive
- **Pix:** gera o BR Code (padrão EMV do Banco Central, com CRC16) direto no navegador
- **Hospedagem:** GitHub Pages
- **Modo demonstração:** sem back-end configurado, o site funciona com dados de exemplo salvos no navegador

## Estrutura

```
index.html          site completo (configuração no objeto CONFIG, no começo do <script>)
img/                fotos (capa.jpg, historia.jpg, galeria)
js/qrcode.js        gerador de QR Code (qrcode-generator, MIT)
backend/Codigo.gs   API em Google Apps Script
COMO-PUBLICAR.md    passo a passo para configurar e manter o site
```

## Configuração

Veja **[COMO-PUBLICAR.md](COMO-PUBLICAR.md)**.

---
Identidade visual: Azul Serenity · Branco · Off-white · Prata
