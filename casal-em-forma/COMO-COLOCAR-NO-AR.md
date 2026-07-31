# Como colocar o Casal em Forma no ar

Guia para quem **não entende de programação**. São 3 partes, todas **gratuitas**,
e leva uns 20 minutos no total. Faça no computador (fica mais fácil que no celular).

Você vai precisar apenas do seu e-mail.

---

## Parte 1 — Criar o banco de dados (Supabase)

O Supabase é onde os dados de vocês ficam guardados na nuvem (hábitos, pesagens,
pontos). O plano gratuito é mais que suficiente.

1. Entre em **https://supabase.com** e clique em **Start your project**.
2. Crie sua conta (pode entrar com a conta do GitHub que você já tem — botão
   "Continue with GitHub" — é o caminho mais fácil).
3. Clique em **New project**:
   - **Name**: `casal-em-forma`
   - **Database Password**: clique em "Generate a password" e **guarde essa senha
     num lugar seguro** (você quase nunca vai precisar dela, mas guarde).
   - **Region**: escolha `South America (São Paulo)`.
   - Clique em **Create new project** e espere 1–2 minutos.
4. Instalar as tabelas do app:
   - No menu lateral esquerdo, clique em **SQL Editor**.
   - Clique em **New query**.
   - Abra o arquivo **`supabase/setup.sql`** desta pasta no GitHub
     (github.com → este repositório → pasta `casal-em-forma` → `supabase` →
     `setup.sql` → botão de copiar no canto do arquivo).
   - Cole tudo na caixa do SQL Editor e clique em **Run** (botão verde).
   - Deve aparecer "Success" no final. Pronto, o banco existe.
5. Criar o login que vocês dois vão usar (uma senha só para o casal):
   - Menu lateral → **Authentication** → **Users** → **Add user** →
     **Create new user**.
   - **Email**: um e-mail seu (ex.: `ogustavoconti@gmail.com`).
   - **Password**: invente a senha que vocês vão digitar para entrar no app.
   - Marque **Auto Confirm User** (importante!) e clique em **Create user**.
6. Anotar as duas "chaves" que o site do app vai usar para falar com o banco:
   - Menu lateral → ícone de engrenagem (**Project Settings**) → **API**.
   - Anote o **Project URL** (parece `https://abcdefgh.supabase.co`).
   - Anote a chave **anon / public** (um texto comprido começando com `eyJ...`).
   - São essas duas + o e-mail do passo 5 que você vai colar no Vercel na Parte 2.

---

## Parte 2 — Colocar o site no ar (Vercel)

O Vercel pega o código que já está no GitHub e transforma num site com link,
de graça, atualizando sozinho a cada mudança.

1. Entre em **https://vercel.com** e clique em **Sign Up**.
2. Escolha **Continue with GitHub** (de novo, o caminho fácil) e autorize.
3. No painel, clique em **Add New...** → **Project**.
4. Na lista de repositórios, ache **App-do-gustavo** e clique em **Import**.
   (Se não aparecer, clique em "Adjust GitHub App Permissions" e libere o
   repositório.)
5. **Atenção — passo mais importante:** em **Root Directory**, clique em
   **Edit** e escolha a pasta **`casal-em-forma`**. Sem isso, o Vercel tenta
   publicar o app errado (o de finanças, que mora na raiz do repositório).
6. Abra a seção **Environment Variables** e adicione, uma por uma, as três
   variáveis abaixo (nome de um lado, valor do outro):

   | Nome | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | o **Project URL** anotado na Parte 1, passo 6 |
   | `VITE_SUPABASE_ANON_KEY` | a chave **anon / public** anotada na Parte 1, passo 6 |
   | `VITE_APP_EMAIL` | o e-mail do usuário criado na Parte 1, passo 5 |

7. Clique em **Deploy** e espere 1–2 minutos.
8. O Vercel mostra o link do site (algo como
   `casal-em-forma.vercel.app`). **Esse é o link do app.** Abra, digite a
   senha que você inventou na Parte 1 passo 5, e pronto.

---

## Parte 3 — Instalar no celular de vocês dois

O app é um PWA: instala direto do navegador, sem loja de aplicativos.

**iPhone**: abra o link no **Safari** → botão de **Compartilhar** (quadrado com
seta para cima) → **Adicionar à Tela de Início**.

**Android**: abra o link no **Chrome** → menu de três pontinhos →
**Adicionar à tela inicial** (ou aceite o aviso "Instalar app" que aparece
sozinho).

Cada um faz isso no próprio celular, entra com a mesma senha, e os dois
aparelhos ficam sincronizados em tempo real.

---

## Dúvidas comuns

**Isso vai me custar algo no futuro?**
Não, no uso de vocês dois. Os planos gratuitos do Supabase e do Vercel cobrem
com folga um app privado de duas pessoas. O Supabase pausa projetos gratuitos
que ficam ~1 semana sem nenhum acesso — usando o app no dia a dia, isso não
acontece; se um dia pausar (após férias longas, por exemplo), basta entrar no
painel do Supabase e clicar em "Restore".

**Esqueci a senha do app. E agora?**
Painel do Supabase → Authentication → Users → clique no usuário → Reset
password / defina uma nova.

**Os pontos começam a contar quando?**
Em **01/08/2026** (é a regra do sistema; nada antes disso pontua). Dá para
mudar essa data na tabela `settings` pelo painel do Supabase, se quiserem.

**Quero mudar os preços das recompensas.**
Dentro do próprio app: aba Casal → engrenagem no canto → Configurações.
