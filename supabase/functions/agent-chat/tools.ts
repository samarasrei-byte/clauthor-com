// ─── AGENT_TOOLS definitions for agent-chat ───
// Static JSON schema definitions for all agent-callable tools. Extracted from
// index.ts to keep the request handler focused on wiring, not on tool contracts.

export const AGENT_TOOLS = [
  {
    type: "function",
    function: {
      name: "send_email",
      description: "Envia um email para um destinatário. Use quando o usuário pedir para enviar email, notificar alguém, ou fazer follow-up.",
      parameters: {
        type: "object",
        properties: {
          to: { type: "string", description: "Email do destinatário" },
          subject: { type: "string", description: "Assunto do email" },
          body: { type: "string", description: "Corpo do email em texto" },
          priority: { type: "string", enum: ["low", "normal", "high", "urgent"], description: "Prioridade do email" },
        },
        required: ["to", "subject", "body"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Cria uma tarefa/atividade para acompanhamento. Use quando o usuário pedir para criar tarefa, lembrete, to-do, ou ação a ser feita.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da tarefa" },
          description: { type: "string", description: "Descrição detalhada" },
          priority: { type: "string", enum: ["low", "medium", "high", "critical"], description: "Prioridade" },
          due_date: { type: "string", description: "Data limite no formato YYYY-MM-DD" },
          assigned_to: { type: "string", description: "Nome ou email de quem vai executar" },
          category: { type: "string", enum: ["sales", "support", "finance", "marketing", "operations", "hr", "other"], description: "Categoria" },
        },
        required: ["title", "priority"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_report",
      description: "Gera um relatório estruturado com dados e análises. Use para DRE, relatórios de vendas, performance, analytics.",
      parameters: {
        type: "object",
        properties: {
          report_type: { type: "string", enum: ["sales", "financial", "performance", "leads", "support_tickets", "marketing_roi", "custom"], description: "Tipo do relatório" },
          title: { type: "string", description: "Título do relatório" },
          period: { type: "string", description: "Período (ex: 'últimos 30 dias', 'Q1 2026')" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string" },
                content: { type: "string" },
                metrics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      value: { type: "string" },
                      trend: { type: "string", enum: ["up", "down", "stable"] },
                    },
                    required: ["label", "value"],
                  },
                },
              },
              required: ["heading", "content"],
            },
            description: "Seções do relatório",
          },
        },
        required: ["report_type", "title", "period", "sections"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_leads",
      description: "Pesquisa e qualifica leads/prospects. Use para prospecção de vendas, busca de clientes potenciais.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termo de busca ou perfil de cliente ideal (ICP)" },
          industry: { type: "string", description: "Segmento/indústria" },
          location: { type: "string", description: "Localização geográfica" },
          company_size: { type: "string", enum: ["startup", "small", "medium", "large", "enterprise"], description: "Porte da empresa" },
          max_results: { type: "number", description: "Número máximo de resultados (1-20)" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_meeting",
      description: "Agenda uma reunião ou compromisso. Use quando o usuário pedir para agendar, marcar reunião, call ou encontro.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título da reunião" },
          date: { type: "string", description: "Data no formato YYYY-MM-DD" },
          time: { type: "string", description: "Horário no formato HH:MM" },
          duration_minutes: { type: "number", description: "Duração em minutos" },
          participants: { type: "array", items: { type: "string" }, description: "Lista de participantes (nomes ou emails)" },
          meeting_type: { type: "string", enum: ["video_call", "phone", "in_person", "hybrid"], description: "Tipo de reunião" },
          notes: { type: "string", description: "Notas ou pauta da reunião" },
        },
        required: ["title", "date", "time", "duration_minutes"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_data",
      description: "Analisa dados e fornece insights baseados nos dados reais do Company Board. Use para análise de métricas, KPIs, tendências, comparações.",
      parameters: {
        type: "object",
        properties: {
          analysis_type: { type: "string", enum: ["trend", "comparison", "forecast", "anomaly", "summary"], description: "Tipo de análise" },
          data_source: { type: "string", description: "Fonte dos dados (ex: vendas, leads, tickets)" },
          period: { type: "string", description: "Período da análise" },
          metrics: { type: "array", items: { type: "string" }, description: "Métricas a analisar" },
          question: { type: "string", description: "Pergunta específica a responder" },
        },
        required: ["analysis_type", "data_source", "question"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delegate_to_agent",
      description: "Delega uma tarefa para OUTRO agente especializado do mesmo tenant.",
      parameters: {
        type: "object",
        properties: {
          target_agent_name: { type: "string", description: "Nome do agente alvo" },
          task_description: { type: "string", description: "Descrição clara da tarefa a ser delegada" },
          context: { type: "string", description: "Contexto relevante para o agente alvo" },
          priority: { type: "string", enum: ["low", "normal", "high", "urgent"], description: "Prioridade" },
          expect_result: { type: "boolean", description: "Se true, aguarda resultado do agente alvo" },
        },
        required: ["target_agent_name", "task_description"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_crm",
      description: "Busca contatos, deals ou empresas no CRM do usuário. Use para pesquisar no CRM integrado.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termo de busca" },
          type: { type: "string", enum: ["contacts", "deals", "companies"], description: "Tipo de registro a buscar" },
          limit: { type: "number", description: "Número máximo de resultados" },
        },
        required: ["query", "type"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_crm_record",
      description: "Cria um novo contato, deal ou empresa no CRM do usuário.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["contact", "deal", "company"], description: "Tipo de registro" },
          data: { type: "object", description: "Dados do registro (nome, email, valor, etc.)" },
        },
        required: ["type", "data"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_crm_record",
      description: "Atualiza um registro existente no CRM do usuário.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "Tipo de registro (contact, deal, company)" },
          record_id: { type: "string", description: "ID do registro a atualizar" },
          data: { type: "object", description: "Campos a atualizar" },
        },
        required: ["type", "record_id", "data"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_message",
      description: "Envia mensagem via canal de comunicação (WhatsApp, Slack ou Instagram DM).",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", enum: ["whatsapp", "slack", "instagram"], description: "Canal de envio" },
          to: { type: "string", description: "Destinatário (número, channel ID ou username)" },
          message: { type: "string", description: "Texto da mensagem" },
          template_id: { type: "string", description: "ID do template (opcional, para WhatsApp)" },
        },
        required: ["channel", "to", "message"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_spreadsheet",
      description: "Lê dados de uma planilha Google Sheets.",
      parameters: {
        type: "object",
        properties: {
          spreadsheet_id: { type: "string", description: "ID da planilha" },
          range: { type: "string", description: "Range a ler (ex: 'Sheet1!A1:D10')" },
        },
        required: ["spreadsheet_id", "range"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_spreadsheet",
      description: "Escreve dados em uma planilha Google Sheets.",
      parameters: {
        type: "object",
        properties: {
          spreadsheet_id: { type: "string", description: "ID da planilha" },
          range: { type: "string", description: "Range a escrever (ex: 'Sheet1!A1')" },
          values: { type: "array", items: { type: "array", items: {} }, description: "Dados em formato matriz [[linha1], [linha2]]" },
        },
        required: ["spreadsheet_id", "range", "values"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_campaign",
      description: "Cria, atualiza, pausa ou obtém insights de campanhas de ads (Meta Ads). Google Ads ainda não disponível.",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["meta"], description: "Plataforma de ads" },
          action: { type: "string", enum: ["create", "pause", "update", "get_insights"], description: "Ação a executar" },
          campaign_data: { type: "object", description: "Dados da campanha (nome, orçamento, público, etc.)" },
        },
        required: ["platform", "action"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Pesquisa na web para encontrar informações atualizadas. Usa Firecrawl para busca e scraping.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Termo de pesquisa" },
          max_results: { type: "number", description: "Número máximo de resultados (1-10)" },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "manage_project",
      description: "Cria, atualiza ou lista tarefas em ferramentas de gerenciamento de projetos (Trello ou Notion). Jira ainda não disponível.",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["trello", "notion"], description: "Plataforma de projetos" },
          action: { type: "string", enum: ["create", "update", "list"], description: "Ação a executar" },
          data: { type: "object", description: "Dados da tarefa (título, descrição, status, etc.)" },
        },
        required: ["platform", "action", "data"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_bulk_message",
      description: "Envia mensagens em massa para múltiplos destinatários. AÇÃO DE ALTO RISCO - sempre confirme com o usuário antes de executar.",
      parameters: {
        type: "object",
        properties: {
          channel: { type: "string", enum: ["whatsapp", "slack", "email"], description: "Canal de envio" },
          recipients: { type: "array", items: { type: "string" }, description: "Lista de destinatários" },
          message: { type: "string", description: "Texto da mensagem" },
          template_id: { type: "string", description: "ID do template (opcional)" },
        },
        required: ["channel", "recipients", "message"],
        additionalProperties: false,
      },
    },
  },
];
