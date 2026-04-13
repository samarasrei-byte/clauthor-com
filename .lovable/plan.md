

# Plano: Acesso Total para Admin sem Pagamento

## Problema
O admin (`admin@clauthor.com`) precisa acessar todos os agentes sem pagar. Atualmente:
- Na Library, o botão "Contratar" redireciona para `/dashboard` sem criar acesso real
- Na AgentLanding, o CTA sempre leva para `/auth` com fluxo de pagamento
- No Dashboard, "Agentes Contratados" mostra apenas assinaturas reais do banco

## Mudanças

### 1. AgentLanding.tsx — CTA inteligente para admin
Importar `useAuth` e verificar `isAdmin`. Se admin, o botão CTA redireciona direto para `/dashboard` (ou `/lex-cadastro` no caso do LEX) em vez de ir para `/auth` com pagamento.

### 2. Library.tsx — Melhorar bypass do admin
O bypass atual (linha 107) já funciona. Ajustar para mostrar um toast "Acesso admin — todos os agentes disponíveis" ao clicar.

### 3. ClientDashboard.tsx — Admin vê todos os agentes como contratados
Quando `isAdmin`, em vez de buscar apenas assinaturas reais, gerar uma lista virtual com todos os agentes do WORKFORCE como "contratados" com status ativo e preço zero. Isso faz o painel "Agentes Contratados" mostrar todos os agentes disponíveis.

### 4. ContractedAgents.tsx — Nenhuma mudança necessária
O componente já renderiza o que recebe via props. A lógica de dados fica no ClientDashboard.

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/AgentLanding.tsx` | Importar `useAuth`, CTA condicional para admin |
| `src/pages/ClientDashboard.tsx` | Gerar lista virtual de todos os agentes para admin |
| `src/pages/Library.tsx` | Toast de feedback ao admin |

