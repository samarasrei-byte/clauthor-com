

# Plano: Melhorar Visibilidade do LEX no Marketplace e Times

## Diagnóstico

O LEX **já existe** no marketplace e está funcionando. Ele aparece dentro do departamento **Operations > Legal Squad**. O problema é de **visibilidade** — ele está enterrado dentro de um departamento genérico e sem destaque visual.

Evidência: ao buscar "Lex" no marketplace, aparecem 2 resultados e o card está completo com tags (DJEN, Prazos, WhatsApp), preço ($197/mês) e botão ACESSAR. A landing page `/agente/lex_guardian` também funciona.

---

## Melhorias Propostas

### 1. Adicionar "Jurídico" como filtro de departamento no Team Builder

O `categoryFilters` em `TeamBuilder.tsx` não tem "Jurídico". Adicionar para que o LEX apareça ao filtrar.

Arquivo: `src/pages/TeamBuilder.tsx` — adicionar `{ id: "juridico", label: "Jurídico" }` e mapear `lex_guardian` para `juridico` no `departmentMap.ts`.

### 2. Adicionar cor do departamento "legal" no Library

O `DEPT_COLORS` em `Library.tsx` não tem entrada para quando o legal squad aparece. Adicionar cor temática (slate/indigo) para o departamento que contém agentes jurídicos.

### 3. Destacar LEX como agente "Featured" no marketplace

Adicionar `lex_guardian` ao array `featuredKeys` em `libraryAgentData.ts` para que apareça em destaque no topo.

### 4. Adicionar landing page dedicada no `agentLandingData.ts`

Atualmente o LEX usa o fallback genérico do WORKFORCE. Criar uma entrada completa com:
- Hero headline: "Zero Prazos Perdidos"
- Problemas específicos do advogado (prazos vencidos, DJEN manual, etc.)
- Soluções (monitoramento automático, WhatsApp alerts, controle de deadline)
- Comparação com workflow manual
- CTA redirecionando para `/lex-cadastro`

### 5. Mapear `lex_guardian` no `departmentMap.ts`

Adicionar `lex_guardian: "juridico"` no `MANUAL_SLUG_TO_DEPT` para que o TeamBuilder o categorize corretamente.

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/data/libraryAgentData.ts` | Adicionar `lex_guardian` ao `featuredKeys` |
| `src/data/departmentMap.ts` | Mapear `lex_guardian → juridico` |
| `src/pages/TeamBuilder.tsx` | Adicionar filtro "Jurídico" ao `categoryFilters` |
| `src/pages/Library.tsx` | Adicionar cor "legal" ao `DEPT_COLORS` |
| `src/data/agentLandingData.ts` | Criar landing page completa para `lex_guardian` |

