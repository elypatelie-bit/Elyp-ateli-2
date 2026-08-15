# 🪡 Elyp Ateliê — guia de publicação (passo a passo, sem custo pra começar)

Este é o código completo da sua loja: site pros clientes + painel administrativo,
com banco de dados de verdade, login, pagamento PIX e frete automático.

**Nenhuma das etapas abaixo é obrigatoriamente paga.** No fim de cada bloco eu
marco o que é 100% grátis e o que é opcional/pago.

---

## 0. O que você precisa instalar no seu computador

- [Node.js](https://nodejs.org) versão 18 ou mais nova (instalador simples, clique em "next" até terminar)
- Uma conta no [GitHub](https://github.com) (grátis)
- Um editor de código, tipo [VS Code](https://code.visualstudio.com) (grátis)

---

## 1. Colocar o código no GitHub

1. Crie uma conta no GitHub (se ainda não tiver).
2. Crie um repositório novo, vazio, chamado `elyp-atelie`.
3. No seu computador, dentro da pasta deste projeto, rode:
   ```
   git init
   git add .
   git commit -m "primeira versão da loja"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/elyp-atelie.git
   git push -u origin main
   ```
   *(o GitHub te mostra esses comandos exatos quando você cria o repositório — pode copiar de lá)*

💰 **Custo: grátis.**

---

## 2. Criar o banco de dados (Neon)

1. Crie uma conta em **[neon.tech](https://neon.tech)** (dá pra entrar com GitHub).
2. Clique em "Create a project" → escolha uma região perto do Brasil (ex: `us-east`).
3. Copie a "Connection string" que aparece (começa com `postgresql://...`).
4. Guarde ela — vai usar no passo 5.

💰 **Custo: grátis** (o plano free do Neon é generoso pra uma loja começando).

*Alternativa: [supabase.com](https://supabase.com) funciona do mesmo jeito, também tem plano grátis.*

---

## 3. Criar o login com Google

1. Vá em **[console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)**
2. Crie um projeto novo (qualquer nome).
3. Clique em "Create Credentials" → "OAuth client ID" → tipo "Web application".
4. Em "Authorized redirect URIs" adicione (você vai trocar a URL depois que publicar):
   ```
   http://localhost:3000/api/auth/callback/google
   https://SEU-SITE.vercel.app/api/auth/callback/google
   ```
5. Copie o **Client ID** e o **Client Secret**.

💰 **Custo: grátis.**

---

## 4. (Opcional) Configurar SMS de verdade para login por telefone

Se você **não** fizer esse passo, o sistema funciona em "modo demonstração": ele
mostra o código de verificação na tela em vez de mandar SMS. Funciona igual pro
cliente, só não é "de verdade" — pode deixar assim pra começar sem gastar nada.

Se quiser SMS de verdade depois:
1. Crie conta em [twilio.com](https://www.twilio.com) (ganha um crédito grátis pra testar).
2. Pegue `Account SID`, `Auth Token` e compre um número de telefone Twilio.

💰 **Custo: opcional, paga por SMS enviado (bem barato, poucos centavos cada).**

---

## 5. Configurar as variáveis de ambiente

1. Copie o arquivo `.env.example` e renomeie a cópia para `.env`
2. Preencha pelo menos:
   - `DATABASE_URL` (do passo 2)
   - `NEXTAUTH_SECRET` → gere um valor rodando `openssl rand -base64 32` no terminal (ou peça pra mim gerar um)
   - `NEXTAUTH_URL=http://localhost:3000`
   - `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (do passo 3)

Os campos de Twilio, Mercado Pago, Resend e Blob podem ficar em branco por
enquanto — o site funciona sem eles (em modo demo/manual).

---

## 6. Rodar no seu computador pela primeira vez

Dentro da pasta do projeto:

```
npm install
npm run db:push       # cria as tabelas no banco a partir do schema
npm run db:seed       # cria a loja, categorias e produtos de exemplo
npm run dev
```

Abra **http://localhost:3000** — sua loja já está no ar, no seu computador.

Pra virar administrador (poder acessar `/admin`):
1. Entre no site pelo menos uma vez com seu e-mail Google.
2. Rode: `npx tsx prisma/make-admin.ts seu-email@gmail.com`
3. Acesse **http://localhost:3000/admin**.

---

## 7. Publicar de verdade (Vercel)

1. Crie conta em **[vercel.com](https://vercel.com)** com seu GitHub.
2. Clique em "Add New Project" → escolha o repositório `elyp-atelie`.
3. Em "Environment Variables", cole **todas** as variáveis do seu `.env`
   (troque `NEXTAUTH_URL` para `https://SEU-SITE.vercel.app`).
4. Clique em "Deploy". Em 1-2 minutos seu site está no ar em
   `https://elyp-atelie-SEUUSUARIO.vercel.app` (ou nome parecido).
5. Volte no Google Cloud (passo 3) e adicione essa URL final na lista de
   "Authorized redirect URIs".

💰 **Custo: grátis** no plano Hobby da Vercel (mais que suficiente pra começar).

---

## 8. (Opcional) Pagamento automático — Mercado Pago

Sem esse passo, o PIX continua funcionando (o QR Code e o código Copia-e-Cola
são gerados de verdade, com sua chave Pix real) — só que a confirmação de
pagamento continua **manual** (você aperta "Marcar como pago" no painel).

Pra automatizar:
1. Crie conta em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Pegue o **Access Token** em Suas Integrações → sua aplicação → Credenciais
3. Configure o webhook apontando para: `https://SEU-SITE.vercel.app/api/webhooks/mercadopago`
4. Adapte a criação do PIX (`src/app/api/orders/route.ts`) para usar a API de
   pagamentos do Mercado Pago em vez do código EMV estático — te ajudo com
   isso quando você chegar nessa etapa, é uma mudança pontual.

💰 **Custo: taxa por venda** (~4-5%, só quando vende — sem mensalidade).

---

## 9. (Opcional) Domínio próprio

Compre em [registro.br](https://registro.br) (`.com.br`, ~R$40/ano) ou
[namecheap.com](https://namecheap.com), depois na Vercel vá em
Project → Settings → Domains e siga as instruções.

💰 **Custo: opcional, ~R$40/ano.**

---

## O que já funciona 100% de graça, sem nenhum passo opcional

✅ Site da loja + painel admin publicados
✅ Banco de dados de verdade (Neon)
✅ Login com Google real
✅ Login por telefone (modo demo, sem custo)
✅ PIX real (QR Code + Copia-e-Cola com sua chave)
✅ Frete automático por CEP
✅ Favoritos, avaliações, variações, cupons, estoque, relatórios

## O que precisa de um passo opcional (e pago só quando usado)

- SMS de verdade → Twilio
- Confirmação automática de pagamento → Mercado Pago
- E-mail de confirmação → Resend (tem plano grátis também, na real)
- Domínio bonito → registro.br

---

Qualquer erro que aparecer no caminho, me manda a mensagem de erro exata que eu
te ajudo a resolver. 🤍
