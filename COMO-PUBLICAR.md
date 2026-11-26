# Site Luan & Amanda: configuração e manutenção

O site fica no GitHub Pages: **https://rodrigoppastro.github.io/casamento-luan-amanda/**
Qualquer arquivo alterado aqui no repositório entra no ar sozinho em 1 ou 2 minutos.

Enquanto o passo 1 não for feito, o site roda em **modo demonstração**: tudo aparece, mas as respostas ficam só no navegador de quem testou.

## 1. Criar a planilha que guarda tudo (com a conta Google da Amanda, uma vez só)
1. Entre em sheets.google.com e crie uma planilha em branco ("Casamento Luan & Amanda").
2. Menu **Extensões → Apps Script**. Apague o que estiver lá e cole todo o conteúdo de `backend/Codigo.gs`.
3. Ajuste no começo do código:
   - `SENHA_ADMIN`: a senha do Painel do Casal. **Nunca coloque a senha real aqui no GitHub**, só no Apps Script.
   - `EMAILS_AVISO`: os e-mails dos dois, separados por vírgula, para receber aviso de cada confirmação.
4. Salve. No topo, escolha a função **configurar** e clique **▶ Executar**. Autorize com a conta Google (se aparecer "app não verificado": Avançado → Acessar). Isso cria as abas Convidados, Mensagens, Fotos e Presentes, e uma pasta no Drive para as fotos dos convidados.
5. **Implantar → Nova implantação** → engrenagem → **App da Web**. Executar como: **Eu**. Quem pode acessar: **Qualquer pessoa**. Clique em Implantar e **copie a URL** (termina em `/exec`).

## 2. Ligar o site à planilha
No GitHub, abra `index.html` → ícone de lápis (Edit) → procure `API_URL: ''` e cole a URL entre as aspas → **Commit changes**.

## 3. Colocar a lista de convidados
Na aba **Convidados** da planilha, uma pessoa por linha, a partir da linha 2:
- **Nome**: nome completo, como no convite
- **Tipo**: Adulto ou Criança
- **Responsavel**: só para criança, com o nome completo do adulto responsável
- **Telefone**: WhatsApp com DDD, ex.: 21985741380

Deixe a coluna **Codigo** vazia. Depois, no Apps Script, rode a função **gerarCodigosFaltantes**: cada convidado ganha um código e um link próprio.
Também dá para adicionar convidados um a um pelo Painel do Casal.

## 4. Painel do Casal
Endereço do site + `#painel` (ou o link "Painel" no menu), com a senha do passo 1. Lá vocês têm:
- o resumo de confirmados, recusas e pendentes
- botões **Convite** e **Lembrete**, que abrem o WhatsApp com a mensagem e o link individual
- a exportação da lista (CSV). A planilha também baixa em Excel: Arquivo → Fazer download → .xlsx
- os presentes informados e o total
- a aprovação de recados e fotos
- o QR Code do site

## 5. Trocar a foto da capa (ou da história)
1. Escolha uma foto **em pé (vertical)**, com espaço acima das cabeças, porque os nomes ficam ali no celular.
2. Renomeie para **capa.jpg** (ou **historia.jpg**).
3. No GitHub, entre na pasta `img` → **Add file → Upload files** → arraste a foto → **Commit changes**. Ela substitui a antiga.
4. Se o enquadramento cortar as cabeças, edite no `index.html` (`CONFIG`):
   `CAPA_FOCO_COMPUTADOR: '50% 15%'` e `CAPA_FOCO_CELULAR: '50% 0%'`. O segundo número escolhe a altura: `0%` mostra o topo, `50%` o meio, `100%` a parte de baixo.

Dica: diminua fotos grandes antes de subir (squoosh.app, ~1400 px de largura), para o site abrir rápido no celular.

## 6. Mais fotos na galeria
Suba as fotos na pasta `img` (ex.: `foto1.jpg`) e acrescente no `CONFIG`, em `FOTOS_CASAL`:
`{ src: 'img/foto1.jpg', legenda: 'Nosso noivado' },`

## 7. Editar textos, presentes e perguntas
Tudo fica no objeto `CONFIG` no começo do `<script>` do `index.html`: `PRESENTES` (nome, descrição, valor; `valor: 0` = o convidado escolhe), `FAQ`, locais e dados do Pix.

## Bom saber
- **Pix**: o QR Code sai com o valor certo e cai na conta da Amanda (Neon). O site não confirma o pagamento sozinho: o "Já fiz o Pix" é o convidado avisando. Confira no extrato.
- **WhatsApp**: convites e lembretes saem pelo WhatsApp de vocês, com um clique por pessoa. Mandar automático exige a API paga do WhatsApp Business.
- **Domínio próprio** (opcional): registre `luaneamanda.com.br` no registro.br e configure em Settings → Pages → Custom domain.
- O repositório é público: dados de convidados, recados e fotos **não** ficam aqui, só na planilha e no Drive da Amanda.
