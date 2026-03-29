

# Configurar ElevenLabs — API Key + Voice ID

## O que será feito

1. **Atualizar o secret `ELEVENLABS_API_KEY`** com a nova chave fornecida
2. **Salvar o Voice ID `57fRHlU547szfU1IrRoS`** na tabela `platform_credentials` para que o Thor use essa voz

## Detalhes técnicos

- Usar a ferramenta `add_secret` para atualizar `ELEVENLABS_API_KEY` com o valor `sk_c319d6dde1ea6642447937d86c17b7a731341a611dca871c`
- Inserir/atualizar registro em `platform_credentials` com `integration_name=elevenlabs`, `credential_key=voice_id`, `credential_value=57fRHlU547szfU1IrRoS`
- Após configuração, o TTS do Thor passará a usar a voz correta via ElevenLabs em vez do fallback nativo do navegador

