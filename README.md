# GustavoConti · Finanças

Controle financeiro pessoal no formato **fluxo de caixa dia a dia** — passado, presente e futuro — com a identidade visual do manual de marca Gustavo Conti.

Funciona como **PWA**: abre no navegador do computador e do celular, e pode ser instalado na tela inicial (no iPhone: Safari → Compartilhar → "Adicionar à Tela de Início"). Depois de carregado uma vez, funciona offline.

## O que o app faz

- **Saldos (fluxo de caixa)** — grade dia a dia do mês com o saldo em conta corrido na coluna da direita. Navegue por meses e anos (passado e futuro) e toque num dia para ver/lançar movimentações. Visão anual com resumo de cada mês.
- **6 tipos de movimentação**:
  - **entrada** (+) — salário, vendas, rendas variáveis;
  - **saída** (−) — contas, boletos, restaurantes;
  - **diário** (−) — gastos do dia a dia que consomem o teto diário;
  - **economia** (−) — dinheiro guardado;
  - **gasto com cartão** — registrado e contabilizado no custo de vida, mas **não mexe no saldo em conta** (lance o pagamento da fatura como *saída* no vencimento), para que o saldo do app bata com o saldo somado das suas contas no banco;
  - **investimento** (− aporte / + resgate) — vinculado a uma **caixinha**.
- **Parcelamentos e recorrências** — compra parcelada em 24×, financiamento de 30 anos (360 meses), salário fixo mensal: o app materializa cada ocorrência no futuro, então você já vê quanto estará devendo/ganhando em janeiro de 2028. Ao excluir, escolha: só esta / esta e futuras / série inteira.
- **Gasto diário (a "mega diária")** — tags marcadas como *diário* têm orçamento mensal (ex.: ALIMENTAÇÃO 200, TRANSPORTE 500…). O total é dividido pelos dias do mês e vira a diária. Cada dia futuro carrega a **previsão de diário**, que zera à meia-noite e é substituída pelo que você lançar de fato. Estourou hoje? O saldo projetado mostra o efeito na hora.
- **Totais do mês** — performance (entradas − todas as saídas − previsões), % economizado com meta, custo de vida, diário médio vs. diária ideal, e saldo projetado ao fim do mês.
- **Investimentos com caixinhas** — crie objetivos (reserva de emergência, viagem…), com meta, prazo, barra de progresso e o quanto guardar por mês para chegar lá. Aportes saem da conta bancária e entram na caixinha; resgates fazem o caminho inverso.
- **Contas bancárias** — cadastre suas contas com saldo inicial; o saldo do dia no app deve bater com a soma das contas no banco.
- **Senha de acesso** — defina uma senha no menu; o app bloqueia ao abrir (hash local SHA-256, nada sai do aparelho).
- **Backup** — exporte/importe um arquivo JSON para transferir os dados entre aparelhos ou guardar por segurança.

## Onde ficam os dados

No `localStorage` do navegador do aparelho — privados e offline. Para usar no celular **e** no computador, use o backup (menu → exportar/importar) para levar os dados de um para o outro. Sincronização automática entre aparelhos exigiria um servidor; a base está pronta para evoluir para isso.

## Desenvolvimento

```bash
npm install
npm run dev      # servidor local
npm test         # testes da engine de cálculo
npm run build    # build de produção em dist/
```

## Publicação

O workflow `.github/workflows/deploy.yml` publica automaticamente no **GitHub Pages** a cada push na `main` (ative em Settings → Pages → Source: GitHub Actions). A URL gerada abre em qualquer aparelho.
