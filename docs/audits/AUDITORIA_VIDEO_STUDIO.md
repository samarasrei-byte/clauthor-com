# Auditoria Video Studio — Estabilidade & UX

**Data:** 2026-07-16
**Escopo:** pipeline de upload → geração → poll → biblioteca

## Achados & Status

| # | Item | Severidade | Status |
|---|------|-----------|--------|
| 1 | Signed URL de 24h pode expirar antes do provider baixar | Média | ⚠ Mitigado — Veo3 já inline base64; Replicate recebe URL fresca no dispatch |
| 2 | Race entre `check_video_quota` e insert (double submit) | Baixa | ✅ Front bloqueia via `submitting`; backend valida cota antes do insert |
| 3 | `useVideoUpload` sem retry — falha silenciosa em rede intermitente | **Alta** | ✅ **Corrigido** — retry exponencial 3× (500ms → 1s → 2s) |
| 4 | Timeout de 20min marca `failed` mesmo se provider ainda processa | Média | ⏳ Pendente — considerar 45min no próximo sprint |
| 5 | Payload Veo3 sem `personGeneration` correto | Baixa | ✅ Já usa `"allow_all"` |
| 6 | Alguns returns de `video-generate` sem `corsHeaders` | Alta | ✅ Verificado — helper `json()` já inclui em 100% dos returns |
| 7 | Realtime channels duplicados após remount | Baixa | ⚠ Aceito — `Math.random()` no name + cleanup no useEffect |
| 8 | Bucket `videos` sem policy SELECT por prefix do user | Alta | ⏳ Pendente — próxima migração RLS de storage |

## Correções aplicadas nesta sprint

### 1. Retry no `useVideoUpload`
- Loop de 3 tentativas com backoff exponencial (500ms, 1s, 2s).
- Detecta erros não-retryable (permission/size/duplicate) e aborta cedo.
- Progresso incremental por tentativa.
- Toast final agrega o número de tentativas.

### 2. Copiloto Thor (redução de fricção)
- Substitui o textarea "prompt cru" pela conversa guiada — reduz drasticamente a chance do usuário submeter um prompt fraco que gere resultado ruim.
- Prompt final sempre em inglês, cinematográfico, 40–120 palavras (formato validado que os modelos Veo3/Replicate respondem melhor).
- Edge function `video-copilot` usa `openai/gpt-5.5` via Lovable AI Gateway, com o DNA da empresa injetado quando disponível.

## Recomendações próximas sprints

1. **Migration de storage RLS**: `SELECT` no bucket `videos` restrito a `(storage.foldername(name))[1] = tenant_id_do_user`.
2. **Timeout 45min** no reconcile de jobs stuck (hoje em 20min no `video-generate`).
3. **Onboarding do copiloto**: tour de 3 passos na primeira visita ao `/video-studio`.
4. **Fallback de provider**: se Veo3 falha por quota Google, tentar automaticamente Replicate.
5. **Preview automático de thumbnail**: gerar frame 1s do vídeo no `video-poll` para acelerar carregamento da biblioteca.

## Arquitetura pós-correções

```text
[User] ──> Copiloto Thor (chat) ──> streaming SSE ──> video-copilot
                                                        │
                                                        ▼
                                                   openai/gpt-5.5
                                                        │
                                                        ▼
                                                Prompt final <<<PROMPT>>>
                                                        │
[User revisa/edita] ──> handleGenerate ──> video-generate ──> Provider
                                                        │
                                                        ▼
                                             video_generations (queued)
                                                        │
                                                        ▼
                                                cron video-poll (15s)
                                                        │
                                                        ▼
                                                    completed + storage
```
