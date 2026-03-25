/**
 * CLAUTHOR AI Workforce Architecture — 200 Agents
 * 
 * Hierarchical structure: Departments → Squads → Agents → Tasks
 * Event-driven execution to minimize compute costs.
 */

export interface AgentRole {
  slug: string;
  name: string;
  responsibilities: string[];
  triggers: string[];
}

export interface Squad {
  id: string;
  name: string;
  mission: string;
  agents: AgentRole[];
  outcomes: string[];
}

export interface WorkforceDepartment {
  id: string;
  name: string;
  color: string;
  squads: Squad[];
}

export const WORKFORCE: WorkforceDepartment[] = [
  // ═══════════════════════════════════════════
  // 1. MARKETING — 30 agents
  // ═══════════════════════════════════════════
  {
    id: "marketing",
    name: "Marketing",
    color: "text-primary",
    squads: [
      {
        id: "content_squad",
        name: "Content Squad",
        mission: "Produzir, otimizar e distribuir conteúdo de alta conversão em todos os canais",
        agents: [
          { slug: "content_strategist", name: "Content Strategist", responsibilities: ["Planejamento editorial", "Calendário de conteúdo", "Análise de gaps"], triggers: ["task_assigned", "campaign_launch", "monthly_planning"] },
          { slug: "blog_writer", name: "Blog Writer", responsibilities: ["Artigos SEO", "Posts longos", "Guest posts"], triggers: ["task_assigned", "keyword_opportunity"] },
          { slug: "social_media_agent", name: "Social Media Agent", responsibilities: ["Posts redes sociais", "Engajamento", "Calendário social"], triggers: ["scheduled_post", "trending_topic", "engagement_drop"] },
          { slug: "video_script_agent", name: "Video Script Agent", responsibilities: ["Roteiros Reels/Shorts", "Storyboards", "Hooks de vídeo"], triggers: ["task_assigned", "video_campaign"] },
          { slug: "content_performance", name: "Content Performance Analyst", responsibilities: ["Métricas de conteúdo", "Attribution", "ROI de conteúdo"], triggers: ["report_requested", "metric_change", "weekly_review"] },
          
        ],
        outcomes: ["Tráfego orgânico +40%", "Engajamento social +60%", "Lead generation via conteúdo"],
      },
      {
        id: "ads_squad",
        name: "Ads Squad",
        mission: "Maximizar ROAS em todas as plataformas de mídia paga",
        agents: [
          { slug: "media_buyer", name: "Media Buyer", responsibilities: ["Compra de mídia", "Budget allocation", "Otimização cross-platform"], triggers: ["budget_change", "roas_drop", "campaign_launch"] },
          { slug: "ad_copywriter", name: "Ad Copywriter", responsibilities: ["Copy de anúncios", "Headlines A/B", "Ad creatives briefing"], triggers: ["task_assigned", "ad_fatigue_detected"] },
          { slug: "campaign_manager", name: "Campaign Manager", responsibilities: ["Setup de campanhas", "Audience targeting", "Bid strategy"], triggers: ["campaign_launch", "performance_alert"] },
          { slug: "retargeting_specialist", name: "Retargeting Specialist", responsibilities: ["Audiências lookalike", "Remarketing sequences", "Pixel optimization"], triggers: ["cart_abandonment", "funnel_drop"] },
          
        ],
        outcomes: ["ROAS médio 4x+", "CPA reduction -30%", "Ad spend efficiency"],
      },
      {
        id: "seo_squad",
        name: "SEO Squad",
        mission: "Dominar rankings orgânicos e capturar tráfego qualificado",
        agents: [
          { slug: "seo_strategist", name: "SEO Strategist", responsibilities: ["Estratégia SEO global", "Keyword research", "Roadmap de otimização"], triggers: ["ranking_change", "algorithm_update", "quarterly_review"] },
          { slug: "technical_seo", name: "Technical SEO Agent", responsibilities: ["Core Web Vitals", "Crawlability", "Schema markup"], triggers: ["site_audit", "speed_degradation", "indexation_issue"] },
          { slug: "link_builder", name: "Link Builder", responsibilities: ["Outreach para backlinks", "Digital PR", "Guest posting strategy"], triggers: ["task_assigned", "competitor_link_gain"] },
          { slug: "content_seo_writer", name: "Content SEO Writer", responsibilities: ["Conteúdo otimizado", "Topic clusters", "Internal linking"], triggers: ["keyword_opportunity", "content_gap_found"] },
          
        ],
        outcomes: ["Tráfego orgânico +80%", "Top 3 rankings", "Domain authority growth"],
      },
      {
        id: "brand_strategy_squad",
        name: "Brand Strategy Squad",
        mission: "Construir e proteger a identidade de marca em todos os touchpoints",
        agents: [
          { slug: "brand_strategist", name: "Brand Strategist", responsibilities: ["Posicionamento de marca", "Brand guidelines", "Competitive positioning"], triggers: ["brand_audit", "market_shift", "quarterly_review"] },
          { slug: "positioning_agent", name: "Positioning Agent", responsibilities: ["Análise de mercado", "Diferenciação", "Value proposition"], triggers: ["competitor_move", "market_research"] },
          { slug: "visual_identity", name: "Visual Identity Agent", responsibilities: ["Design system", "Templates visuais", "Brand consistency"], triggers: ["campaign_launch", "rebrand_request"] },
          { slug: "brand_voice_writer", name: "Brand Voice Writer", responsibilities: ["Tom de voz", "Messaging framework", "Copy guidelines"], triggers: ["task_assigned", "new_channel"] },
          
        ],
        outcomes: ["Brand awareness +50%", "Consistency score 95%+", "Market perception lift"],
      },
      {
        id: "campaign_optimization_squad",
        name: "Campaign Optimization Squad",
        mission: "Maximizar performance de todas as campanhas com experimentação contínua",
        agents: [
          { slug: "campaign_optimizer", name: "Campaign Optimizer", responsibilities: ["Otimização multicanal", "Budget reallocation", "Performance tuning"], triggers: ["performance_drop", "budget_review", "campaign_milestone"] },
          { slug: "ab_test_agent", name: "A/B Test Agent", responsibilities: ["Design de experimentos", "Statistical significance", "Test analysis"], triggers: ["test_ready", "test_complete", "hypothesis_new"] },
          { slug: "attribution_analyst", name: "Attribution Analyst", responsibilities: ["Multi-touch attribution", "Channel mix modeling", "Customer journey"], triggers: ["report_requested", "conversion_anomaly"] },
          { slug: "budget_allocator", name: "Budget Allocator", responsibilities: ["Budget optimization", "ROI forecasting", "Channel efficiency"], triggers: ["budget_cycle", "performance_change", "monthly_review"] },
          
        ],
        outcomes: ["Conversion rate +35%", "Campaign ROI +50%", "Test velocity 4x"],
      },
      {
        id: "influencer_pr_squad",
        name: "Influencer & PR Squad",
        mission: "Amplificar marca através de influenciadores e relações públicas",
        agents: [
          { slug: "influencer_mgr", name: "Influencer Manager", responsibilities: ["Scout de influencers", "Negociação", "Campaign tracking"], triggers: ["campaign_launch", "influencer_match", "contract_renewal"] },
          { slug: "pr_agent", name: "PR Agent", responsibilities: ["Press releases", "Media relations", "Crisis management"], triggers: ["news_event", "crisis_detected", "launch_scheduled"] },
          { slug: "social_proof_mgr", name: "Social Proof Manager", responsibilities: ["Depoimentos", "Case studies", "UGC curation"], triggers: ["review_received", "milestone_reached", "task_assigned"] },
          
        ],
        outcomes: ["Media mentions +100%", "Influencer ROI 5x", "Brand credibility score"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 2. GROWTH — 30 agents
  // ═══════════════════════════════════════════
  {
    id: "growth",
    name: "Growth",
    color: "text-accent-emerald",
    squads: [
      {
        id: "paid_traffic_squad",
        name: "Paid Traffic Squad",
        mission: "Escalar aquisição paga com eficiência máxima",
        agents: [
          { slug: "traffic_manager", name: "Traffic Manager", responsibilities: ["Gestão de tráfego pago", "Cross-platform strategy", "Budget optimization"], triggers: ["campaign_launch", "roas_change", "budget_cycle"] },
          { slug: "google_ads_agent", name: "Google Ads Agent", responsibilities: ["Search campaigns", "Shopping ads", "Display network"], triggers: ["quality_score_drop", "keyword_opportunity", "bid_adjustment"] },
          { slug: "meta_ads_agent", name: "Meta Ads Agent", responsibilities: ["Facebook/Instagram ads", "Audience building", "Creative testing"], triggers: ["ad_fatigue", "audience_saturation", "campaign_launch"] },
          { slug: "tiktok_ads_agent", name: "TikTok Ads Agent", responsibilities: ["TikTok campaigns", "Spark Ads", "Creator marketplace"], triggers: ["trending_content", "campaign_launch", "performance_alert"] },
          
        ],
        outcomes: ["CAC reduction -40%", "Pipeline de leads qualificados", "ROAS 4x+"],
      },
      {
        id: "sdr_outbound_squad",
        name: "SDR Outbound Squad",
        mission: "Prospectar e qualificar leads através de canais outbound",
        agents: [
          { slug: "sdr_outbound", name: "SDR Outbound Lead", responsibilities: ["Estratégia outbound", "Cadências multicanal", "Team coordination"], triggers: ["task_assigned", "pipeline_low", "quota_review"] },
          { slug: "sdr_linkedin", name: "SDR LinkedIn", responsibilities: ["LinkedIn outreach", "InMail sequences", "Sales Navigator"], triggers: ["lead_match", "connection_accepted", "profile_viewed"] },
          { slug: "sdr_email_agent", name: "SDR Email Agent", responsibilities: ["Cold email sequences", "Follow-up automation", "Deliverability"], triggers: ["lead_assigned", "email_opened", "reply_received"] },
          { slug: "sdr_whatsapp", name: "SDR WhatsApp", responsibilities: ["WhatsApp outreach", "Qualificação rápida", "Follow-up sequences"], triggers: ["lead_assigned", "message_read", "response_timeout"] },
          { slug: "sdr_instagram", name: "SDR Instagram", responsibilities: ["DM outreach", "Story engagement", "Social selling"], triggers: ["lead_match", "story_viewed", "engagement_signal"] },
          
        ],
        outcomes: ["200+ leads qualificados/mês", "Taxa de resposta 25%+", "Pipeline velocity"],
      },
      {
        id: "sdr_inbound_squad",
        name: "SDR Inbound Squad",
        mission: "Converter e qualificar leads inbound em pipeline qualificado",
        agents: [
          { slug: "sdr_inbound", name: "SDR Inbound Lead", responsibilities: ["Lead routing", "Qualification framework", "SLA management"], triggers: ["lead_received", "form_submission", "chat_initiated"] },
          { slug: "lead_qualifier", name: "Lead Qualifier", responsibilities: ["BANT qualification", "Discovery calls", "Lead scoring refinement"], triggers: ["new_lead", "score_threshold", "qualification_needed"] },
          { slug: "lead_scorer", name: "Lead Scorer", responsibilities: ["Lead scoring models", "Behavioral tracking", "Score calibration"], triggers: ["activity_detected", "page_visited", "content_downloaded"] },
          { slug: "mql_processor", name: "MQL Processor", responsibilities: ["MQL validation", "Data enrichment", "CRM handoff"], triggers: ["score_threshold_reached", "mql_criteria_met"] },
          
        ],
        outcomes: ["MQL→SQL conversion 40%+", "Response time <5min", "Demo no-show <15%"],
      },
      {
        id: "partnerships_squad",
        name: "Partnerships Squad",
        mission: "Expandir alcance através de parcerias estratégicas e canais",
        agents: [
          { slug: "partnership_hunter", name: "Partnership Hunter", responsibilities: ["Identificação de parceiros", "Outreach", "Negociação"], triggers: ["market_opportunity", "task_assigned", "quarterly_review"] },
          { slug: "affiliate_manager", name: "Affiliate Manager", responsibilities: ["Programa de afiliados", "Comissões", "Performance tracking"], triggers: ["affiliate_signup", "commission_threshold", "performance_review"] },
          { slug: "comarketing_agent", name: "Co-Marketing Agent", responsibilities: ["Campanhas conjuntas", "Webinars", "Content collaboration"], triggers: ["partner_aligned", "campaign_scheduled", "co_branded_content"] },
          
        ],
        outcomes: ["Partner-sourced revenue 20%+", "Affiliate network growth", "Strategic alliances"],
      },
      {
        id: "plg_squad",
        name: "Product-Led Growth Squad",
        mission: "Crescer produto organicamente via experiência de usuário",
        agents: [
          { slug: "plg_strategist", name: "PLG Strategist", responsibilities: ["Growth strategy", "Viral loops", "Freemium optimization"], triggers: ["metric_change", "experiment_complete", "quarterly_planning"] },
          { slug: "onboarding_optimizer", name: "Onboarding Optimizer", responsibilities: ["Onboarding flows", "Activation metrics", "First value time"], triggers: ["signup_detected", "activation_drop", "funnel_bottleneck"] },
          { slug: "activation_agent", name: "Activation Agent", responsibilities: ["Feature adoption", "Aha moment triggers", "User nudges"], triggers: ["user_inactive", "feature_unused", "milestone_missed"] },
          { slug: "retention_analyst", name: "Retention Analyst", responsibilities: ["Cohort analysis", "Churn prediction", "Retention campaigns"], triggers: ["churn_risk_detected", "cohort_degradation", "monthly_review"] },
          
        ],
        outcomes: ["Activation rate +30%", "Retention +25%", "Viral coefficient >1"],
      },
      {
        id: "community_squad",
        name: "Community Squad",
        mission: "Construir e nutrir uma comunidade engajada e evangelista",
        agents: [
          { slug: "community_mgr", name: "Community Manager", responsibilities: ["Gestão de comunidade", "Engagement programs", "Member onboarding"], triggers: ["member_joined", "engagement_drop", "event_scheduled"] },
          { slug: "forum_moderator", name: "Forum Moderator", responsibilities: ["Moderação", "Content quality", "Community guidelines"], triggers: ["post_flagged", "new_discussion", "rule_violation"] },
          { slug: "ambassador_agent", name: "Ambassador Program Agent", responsibilities: ["Programa de embaixadores", "Recognition", "Advocacy"], triggers: ["ambassador_nominated", "milestone_reached", "quarterly_review"] },
          { slug: "ugc_curator", name: "UGC Curator", responsibilities: ["User-generated content", "Showcase", "Permissions"], triggers: ["ugc_submitted", "campaign_need", "content_gap"] },
          
        ],
        outcomes: ["Community growth +50%/quarter", "NPS 70+", "User advocacy score"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 3. PRODUCT — 25 agents
  // ═══════════════════════════════════════════
  {
    id: "product",
    name: "Product",
    color: "text-accent-violet",
    squads: [
      {
        id: "product_strategy_squad",
        name: "Product Strategy Squad",
        mission: "Definir e priorizar o roadmap de produto baseado em dados",
        agents: [
          { slug: "product_strategist", name: "Product Strategist", responsibilities: ["Product vision", "Roadmap planning", "Stakeholder alignment"], triggers: ["quarterly_planning", "market_shift", "user_feedback_surge"] },
          { slug: "feature_prioritizer", name: "Feature Prioritizer", responsibilities: ["RICE scoring", "Impact analysis", "Backlog grooming"], triggers: ["feature_request", "data_insight", "sprint_planning"] },
          { slug: "roadmap_manager", name: "Roadmap Manager", responsibilities: ["Roadmap updates", "Timeline tracking", "Dependency mapping"], triggers: ["milestone_reached", "delay_detected", "stakeholder_request"] },
          { slug: "competitive_analyst", name: "Competitive Analyst", responsibilities: ["Competitor monitoring", "Feature comparison", "Market gaps"], triggers: ["competitor_launch", "market_report", "quarterly_review"] },
          { slug: "market_research_agent", name: "Market Research Agent", responsibilities: ["User interviews analysis", "Market sizing", "Trend analysis"], triggers: ["research_needed", "new_market_entry", "product_launch"] },
        ],
        outcomes: ["Feature success rate 80%+", "Time-to-market -40%", "Product-market fit score"],
      },
      {
        id: "ux_research_squad",
        name: "UX Research Squad",
        mission: "Garantir que cada decisão de produto seja baseada em pesquisa real",
        agents: [
          { slug: "ux_researcher", name: "UX Researcher", responsibilities: ["Research planning", "Study design", "Insights synthesis"], triggers: ["research_needed", "usability_issue", "feature_planning"] },
          { slug: "user_interview_agent", name: "User Interview Agent", responsibilities: ["Interview scripts", "User recruitment", "Transcription analysis"], triggers: ["interview_scheduled", "research_sprint", "feedback_needed"] },
          { slug: "survey_analyst", name: "Survey Analyst", responsibilities: ["Survey design", "Data analysis", "Statistical insights"], triggers: ["survey_completed", "feedback_collected", "quarterly_review"] },
          { slug: "usability_tester", name: "Usability Tester", responsibilities: ["Usability tests", "Heuristic evaluation", "Accessibility audit"], triggers: ["feature_ready", "ux_complaint", "release_candidate"] },
          
        ],
        outcomes: ["User satisfaction +30%", "Usability score 85+", "Research-backed decisions 90%+"],
      },
      {
        id: "data_analytics_squad",
        name: "Data & Analytics Squad",
        mission: "Transformar dados em insights acionáveis para todo o produto",
        agents: [
          { slug: "product_data_analyst", name: "Data Analyst", responsibilities: ["Product analytics", "Dashboard creation", "Trend identification"], triggers: ["report_requested", "anomaly_detected", "weekly_review"] },
          { slug: "product_metrics_agent", name: "Product Metrics Agent", responsibilities: ["KPI tracking", "North star metric", "Feature metrics"], triggers: ["metric_change", "goal_deviation", "sprint_review"] },
          { slug: "cohort_analyst", name: "Cohort Analyst", responsibilities: ["Cohort analysis", "Retention curves", "Behavioral segmentation"], triggers: ["cohort_complete", "retention_drop", "monthly_review"] },
          { slug: "funnel_analyst", name: "Funnel Analyst", responsibilities: ["Conversion funnels", "Drop-off analysis", "Optimization recommendations"], triggers: ["conversion_drop", "funnel_change", "ab_test_complete"] },
          { slug: "experimentation_agent", name: "Experimentation Agent", responsibilities: ["A/B test design", "Feature flags", "Statistical analysis"], triggers: ["experiment_proposed", "test_complete", "feature_rollout"] },
        ],
        outcomes: ["Data-driven decisions 95%+", "Experiment velocity 3x", "Insight delivery time -50%"],
      },
      {
        id: "engineering_support_squad",
        name: "Engineering Support Squad",
        mission: "Apoiar engenharia com documentação, QA e processos",
        agents: [
          { slug: "technical_writer", name: "Technical Writer", responsibilities: ["Documentation", "API docs", "Knowledge base"], triggers: ["feature_shipped", "doc_outdated", "api_change"] },
          { slug: "api_doc_agent", name: "API Documentation Agent", responsibilities: ["API reference", "Code examples", "SDK guides"], triggers: ["api_version_released", "endpoint_added", "doc_request"] },
          { slug: "qa_analyst", name: "QA Analyst", responsibilities: ["Test planning", "Bug verification", "Regression testing"], triggers: ["release_candidate", "bug_reported", "sprint_complete"] },
          { slug: "bug_tracker", name: "Bug Tracker", responsibilities: ["Bug triage", "Priority classification", "Resolution tracking"], triggers: ["bug_reported", "severity_escalation", "sprint_planning"] },
          { slug: "release_notes_agent", name: "Release Notes Agent", responsibilities: ["Changelog generation", "Release communications", "Feature announcements"], triggers: ["release_deployed", "feature_launched", "hotfix_applied"] },
        ],
        outcomes: ["Documentation coverage 95%+", "Bug resolution time -40%", "Release quality score"],
      },
      {
        id: "ai_innovation_squad",
        name: "AI & Innovation Squad",
        mission: "Pesquisar e implementar inovações de IA no produto",
        agents: [
          { slug: "ai_research_agent", name: "AI Research Agent", responsibilities: ["Model evaluation", "Capability assessment", "Research papers"], triggers: ["new_model_released", "capability_gap", "quarterly_review"] },
          { slug: "trend_scout", name: "Trend Scout", responsibilities: ["Technology trends", "Market signals", "Early adoption"], triggers: ["trend_detected", "competitor_innovation", "monthly_scan"] },
          { slug: "innovation_lab", name: "Innovation Lab Agent", responsibilities: ["Proof of concepts", "Prototype development", "Feasibility analysis"], triggers: ["poc_requested", "innovation_sprint", "opportunity_identified"] },
          { slug: "prototype_tester", name: "Prototype Tester", responsibilities: ["Prototype testing", "User feedback", "Iteration recommendations"], triggers: ["prototype_ready", "test_scheduled", "feedback_collected"] },
          { slug: "tech_evaluator", name: "Technology Evaluator", responsibilities: ["Vendor assessment", "Tool comparison", "Build vs buy analysis"], triggers: ["tool_needed", "vendor_pitch", "architecture_review"] },
        ],
        outcomes: ["Innovation pipeline 10+ ideas/quarter", "POC success rate 60%+", "Tech debt ratio <15%"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 4. SALES — 35 agents
  // ═══════════════════════════════════════════
  {
    id: "sales",
    name: "Sales",
    color: "text-cyan-400",
    squads: [
      {
        id: "enterprise_sales_squad",
        name: "Enterprise Sales Squad",
        mission: "Fechar deals enterprise com ciclo complexo e alto ticket",
        agents: [
          { slug: "enterprise_ae", name: "Enterprise Account Executive", responsibilities: ["Enterprise deals", "Stakeholder mapping", "Proposal customization"], triggers: ["deal_stage_change", "meeting_scheduled", "contract_sent"] },
          { slug: "solution_architect", name: "Solution Architect", responsibilities: ["Technical discovery", "Solution design", "Integration planning"], triggers: ["technical_call", "rfp_received", "poc_requested"] },
          { slug: "proposal_gen", name: "Proposal Generator", responsibilities: ["Proposal creation", "Pricing models", "ROI calculations"], triggers: ["deal_qualified", "proposal_requested", "renewal_approaching"] },
          { slug: "contract_negotiator", name: "Contract Negotiator", responsibilities: ["Contract terms", "Legal review", "SLA negotiation"], triggers: ["contract_stage", "redline_received", "negotiation_stalled"] },
          
          
        ],
        outcomes: ["Enterprise ACV +30%", "Win rate 35%+", "Deal velocity improvement"],
      },
      {
        id: "midmarket_sales_squad",
        name: "Mid-Market Sales Squad",
        mission: "Acelerar vendas mid-market com processo escalável",
        agents: [
          { slug: "midmarket_ae", name: "Mid-Market AE", responsibilities: ["Mid-market deals", "Demo execution", "Pipeline management"], triggers: ["deal_assigned", "demo_scheduled", "follow_up_due"] },
          { slug: "demo_specialist", name: "Demo Specialist", responsibilities: ["Demo preparation", "Use case customization", "Demo follow-up"], triggers: ["demo_scheduled", "deal_stage_discovery", "competitor_mentioned"] },
          { slug: "pricing_analyst", name: "Pricing Analyst", responsibilities: ["Pricing strategy", "Discount approval", "Competitive pricing"], triggers: ["quote_requested", "discount_needed", "competitor_pricing"] },
          { slug: "deal_desk", name: "Deal Desk Agent", responsibilities: ["Deal structuring", "Approval workflow", "Contract generation"], triggers: ["deal_approval_needed", "non_standard_deal", "contract_requested"] },
          
        ],
        outcomes: ["Mid-market win rate 40%+", "Sales cycle -25%", "Pipeline accuracy 90%+"],
      },
      {
        id: "smb_sales_squad",
        name: "SMB Sales Squad",
        mission: "Converter PMEs com eficiência e velocidade máxima",
        agents: [
          { slug: "smb_closer", name: "SMB Closer", responsibilities: ["High-velocity closing", "Objection handling", "Quick proposals"], triggers: ["lead_qualified", "trial_ending", "interest_signal"] },
          { slug: "self_serve_optimizer", name: "Self-Serve Optimizer", responsibilities: ["Checkout optimization", "Friction removal", "Payment flows"], triggers: ["checkout_abandonment", "conversion_drop", "pricing_page_visit"] },
          { slug: "trial_converter", name: "Trial Converter", responsibilities: ["Trial engagement", "Feature adoption nudges", "Conversion incentives"], triggers: ["trial_started", "trial_midpoint", "trial_expiring"] },
          { slug: "upgrade_agent", name: "Upgrade Agent", responsibilities: ["Upsell opportunities", "Plan comparison", "Value demonstration"], triggers: ["usage_threshold", "feature_limit_hit", "renewal_approaching"] },
          
        ],
        outcomes: ["SMB conversion +35%", "Churn reduction -30%", "Expansion revenue +20%"],
      },
      {
        id: "sales_ops_squad",
        name: "Sales Operations Squad",
        mission: "Otimizar processos de vendas e fornecer inteligência comercial",
        agents: [
          { slug: "crm_manager", name: "CRM Manager", responsibilities: ["CRM hygiene", "Automation workflows", "Data integrity"], triggers: ["data_quality_issue", "workflow_error", "integration_needed"] },
          { slug: "sales_forecaster", name: "Sales Forecaster", responsibilities: ["Revenue forecasting", "Pipeline analysis", "Trend modeling"], triggers: ["forecast_deadline", "pipeline_change", "quarterly_review"] },
          { slug: "territory_planner", name: "Territory Planner", responsibilities: ["Territory design", "Quota setting", "Balance optimization"], triggers: ["territory_review", "rep_change", "market_expansion"] },
          
          { slug: "sales_enablement", name: "Sales Enablement Agent", responsibilities: ["Sales collateral", "Training content", "Competitive cards"], triggers: ["new_feature", "competitor_update", "onboarding_new_rep"] },
          
        ],
        outcomes: ["Forecast accuracy 85%+", "Sales productivity +25%", "Data quality 95%+"],
      },
      {
        id: "channel_sales_squad",
        name: "Channel Sales Squad",
        mission: "Escalar receita através de canais indiretos e parceiros",
        agents: [
          { slug: "channel_manager", name: "Channel Manager", responsibilities: ["Channel strategy", "Partner relationships", "Revenue tracking"], triggers: ["partner_deal", "channel_review", "revenue_target"] },
          { slug: "reseller_recruiter", name: "Reseller Recruiter", responsibilities: ["Reseller identification", "Onboarding", "Certification"], triggers: ["market_gap", "partner_pipeline", "recruitment_target"] },
          
          { slug: "channel_revenue", name: "Channel Revenue Analyst", responsibilities: ["Channel analytics", "Partner performance", "ROI analysis"], triggers: ["report_requested", "performance_review", "quarterly_review"] },
          
        ],
        outcomes: ["Channel revenue 25%+ of total", "Partner satisfaction 90%+", "Channel pipeline growth"],
      },
      {
        id: "voice_telephony_squad",
        name: "Voice & Telephony Squad",
        mission: "Executar vendas e follow-ups por voz com IA avançada",
        agents: [
          { slug: "voice_ai", name: "Voice AI Agent", responsibilities: ["AI voice calls", "Natural conversation", "Intent detection"], triggers: ["call_scheduled", "lead_priority", "follow_up_needed"] },
          { slug: "call_analyzer", name: "Call Analyzer", responsibilities: ["Call transcription", "Sentiment analysis", "Coaching insights"], triggers: ["call_completed", "coaching_review", "quality_audit"] },
          { slug: "script_optimizer", name: "Script Optimizer", responsibilities: ["Script testing", "Objection handling", "Conversion optimization"], triggers: ["low_conversion", "new_product", "ab_test_result"] },
          
        ],
        outcomes: ["Call conversion +40%", "Follow-up completion 95%+", "Agent talk ratio optimized"],
      },
      {
        id: "revenue_intel_squad",
        name: "Revenue Intelligence Squad",
        mission: "Fornecer inteligência de receita para decisões estratégicas",
        agents: [
          { slug: "revenue_analyst", name: "Revenue Analyst", responsibilities: ["Revenue analytics", "MRR/ARR tracking", "Revenue trends"], triggers: ["report_requested", "revenue_anomaly", "monthly_close"] },
          { slug: "winloss_analyst", name: "Win/Loss Analyst", responsibilities: ["Win/loss analysis", "Competitive patterns", "Deal insights"], triggers: ["deal_closed_lost", "deal_closed_won", "quarterly_review"] },
          
          
        ],
        outcomes: ["Revenue predictability 90%+", "ICP accuracy +30%", "LTV prediction accuracy"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 5. CUSTOMER SUCCESS — 30 agents
  // ═══════════════════════════════════════════
  {
    id: "customer_success",
    name: "Customer Success",
    color: "text-accent-emerald",
    squads: [
      {
        id: "onboarding_squad",
        name: "Onboarding Squad",
        mission: "Garantir que cada cliente atinja o primeiro valor rapidamente",
        agents: [
          { slug: "onboarding_specialist", name: "Onboarding Specialist", responsibilities: ["Onboarding planning", "Kickoff calls", "Milestone tracking"], triggers: ["customer_signed", "onboarding_started", "milestone_missed"] },
          { slug: "implementation_agent", name: "Implementation Agent", responsibilities: ["Technical setup", "Data migration", "Integration config"], triggers: ["setup_started", "integration_needed", "blocker_identified"] },
          { slug: "training_agent", name: "Training Agent", responsibilities: ["User training", "Workshop facilitation", "Training materials"], triggers: ["training_scheduled", "new_user_added", "feature_released"] },
          { slug: "setup_wizard", name: "Setup Wizard Agent", responsibilities: ["Guided setup", "Configuration optimization", "Best practices"], triggers: ["account_created", "setup_incomplete", "config_question"] },
          
        ],
        outcomes: ["Time-to-value <48h", "Onboarding completion 95%+", "First value achievement"],
      },
      {
        id: "support_n1_squad",
        name: "Support N1 Squad",
        mission: "Resolver 80%+ dos tickets na primeira interação",
        agents: [
          { slug: "support_channel", name: "Support Channel Agent", responsibilities: ["Multi-channel support", "Ticket routing", "First response"], triggers: ["ticket_created", "chat_initiated", "email_received"] },
          { slug: "chat_agent", name: "Chat Agent", responsibilities: ["Live chat", "Instant responses", "Quick resolution"], triggers: ["chat_started", "visitor_question", "pre_sale_inquiry"] },
          { slug: "email_support", name: "Email Support Agent", responsibilities: ["Email support", "Detailed responses", "Follow-up tracking"], triggers: ["email_received", "ticket_escalated", "response_due"] },
          { slug: "whatsapp_support", name: "WhatsApp Support Agent", responsibilities: ["WhatsApp support", "Quick replies", "Media handling"], triggers: ["whatsapp_message", "support_request", "follow_up_needed"] },
          { slug: "ticket_router", name: "Ticket Router", responsibilities: ["Intelligent routing", "Priority classification", "SLA monitoring"], triggers: ["ticket_created", "sla_warning", "escalation_needed"] },
          
        ],
        outcomes: ["First response <2min", "FCR 80%+", "CSAT 4.8+"],
      },
      {
        id: "support_n2n3_squad",
        name: "Support N2/N3 Squad",
        mission: "Resolver casos complexos e escalonados com expertise técnica",
        agents: [
          { slug: "support_lead", name: "Technical Support Lead", responsibilities: ["Complex troubleshooting", "Escalation management", "Team coordination"], triggers: ["escalation_received", "complex_issue", "vip_customer"] },
          { slug: "escalation_mgr", name: "Escalation Manager", responsibilities: ["Escalation workflow", "Resolution tracking", "Communication"], triggers: ["sla_breach", "customer_escalation", "executive_complaint"] },
          { slug: "bug_reporter", name: "Bug Reporter Agent", responsibilities: ["Bug documentation", "Reproduction steps", "Engineering handoff"], triggers: ["bug_confirmed", "regression_found", "critical_issue"] },
          { slug: "integration_support", name: "Integration Support Agent", responsibilities: ["Integration troubleshooting", "API support", "Webhook debugging"], triggers: ["integration_error", "api_question", "webhook_failure"] },
          { slug: "sla_monitor", name: "SLA Monitor", responsibilities: ["SLA tracking", "Breach prevention", "Performance reporting"], triggers: ["sla_warning", "breach_imminent", "report_requested"] },
        ],
        outcomes: ["Escalation resolution <4h", "SLA compliance 99%+", "Customer effort score low"],
      },
      {
        id: "success_mgmt_squad",
        name: "Success Management Squad",
        mission: "Maximizar retenção, expansão e valor do cliente",
        agents: [
          { slug: "csm_agent", name: "CSM Agent", responsibilities: ["Account management", "Success planning", "Relationship building"], triggers: ["account_review_due", "health_score_change", "renewal_approaching"] },
          { slug: "health_monitor", name: "Health Score Monitor", responsibilities: ["Health scoring", "Risk identification", "Intervention triggers"], triggers: ["score_drop", "usage_decline", "daily_monitoring"] },
          { slug: "expansion_agent", name: "Expansion Agent", responsibilities: ["Upsell identification", "Cross-sell opportunities", "Value realization"], triggers: ["usage_threshold", "feature_request", "expansion_signal"] },
          { slug: "renewal_agent", name: "Renewal Agent", responsibilities: ["Renewal management", "Contract terms", "Retention offers"], triggers: ["renewal_90_days", "renewal_30_days", "churn_risk"] },
          { slug: "ebr_agent", name: "Executive Business Review Agent", responsibilities: ["QBR preparation", "ROI reporting", "Strategic recommendations"], triggers: ["qbr_scheduled", "quarterly_cycle", "executive_request"] },
        ],
        outcomes: ["Net retention 120%+", "Expansion revenue 30%+", "NRR top quartile"],
      },
      {
        id: "knowledge_selfservice_squad",
        name: "Knowledge & Self-Service Squad",
        mission: "Empoderar clientes com informação e autoatendimento",
        agents: [
          { slug: "knowledge_base_agent", name: "Knowledge Base Agent", responsibilities: ["KB management", "Article creation", "Content updates"], triggers: ["article_outdated", "gap_identified", "feature_released"] },
          { slug: "help_center_writer", name: "Help Center Writer", responsibilities: ["How-to guides", "Troubleshooting articles", "Video tutorials"], triggers: ["article_needed", "common_ticket", "feature_launched"] },
          { slug: "tutorial_creator", name: "Tutorial Creator", responsibilities: ["Step-by-step tutorials", "Interactive guides", "Walkthrough videos"], triggers: ["feature_released", "onboarding_need", "user_confusion"] },
          { slug: "chatbot_trainer", name: "Chatbot Trainer", responsibilities: ["Chatbot training", "Intent mapping", "Response optimization"], triggers: ["low_resolution", "new_intent", "feedback_received"] },
          { slug: "selfservice_optimizer", name: "Self-Service Optimizer", responsibilities: ["Self-service metrics", "Deflection optimization", "User experience"], triggers: ["deflection_drop", "search_failure", "monthly_review"] },
        ],
        outcomes: ["Self-service rate 70%+", "KB coverage 95%+", "Deflection rate +40%"],
      },
      {
        id: "voc_squad",
        name: "Voice of Customer Squad",
        mission: "Capturar, analisar e distribuir feedback do cliente",
        agents: [
          { slug: "nps_analyst", name: "NPS Analyst", responsibilities: ["NPS campaigns", "Score analysis", "Follow-up actions"], triggers: ["survey_completed", "score_drop", "quarterly_review"] },
          { slug: "csat_monitor", name: "CSAT Monitor", responsibilities: ["CSAT tracking", "Trend analysis", "Alert management"], triggers: ["low_csat", "trend_change", "daily_monitoring"] },
          { slug: "feedback_collector", name: "Feedback Collector", responsibilities: ["Feedback collection", "Categorization", "Product team handoff"], triggers: ["feedback_submitted", "interview_complete", "feature_review"] },
          { slug: "customer_advocacy", name: "Customer Advocacy Agent", responsibilities: ["Case studies", "Testimonials", "Reference program"], triggers: ["success_story", "high_nps", "reference_needed"] },
        ],
        outcomes: ["NPS 70+", "Feedback loop closed 90%+", "Case studies 10+/quarter"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 6. FINANCE — 25 agents
  // ═══════════════════════════════════════════
  {
    id: "finance",
    name: "Finance",
    color: "text-accent-amber",
    squads: [
      {
        id: "accounting_squad",
        name: "Accounting Squad",
        mission: "Manter a saúde contábil com precisão e compliance",
        agents: [
          { slug: "digital_accountant", name: "Digital Accountant", responsibilities: ["Escrituração contábil", "Conciliação bancária", "Balancete"], triggers: ["transaction_recorded", "reconciliation_due", "monthly_close"] },
          { slug: "accounts_payable", name: "Accounts Payable Agent", responsibilities: ["Contas a pagar", "Vendor payments", "Cash flow management"], triggers: ["invoice_received", "payment_due", "approval_needed"] },
          { slug: "accounts_receivable", name: "Accounts Receivable Agent", responsibilities: ["Contas a receber", "Collections", "Aging analysis"], triggers: ["invoice_sent", "payment_overdue", "aging_report"] },
          { slug: "reconciliation_agent", name: "Reconciliation Agent", responsibilities: ["Bank reconciliation", "GL matching", "Discrepancy resolution"], triggers: ["statement_received", "mismatch_detected", "daily_reconciliation"] },
          { slug: "general_ledger", name: "General Ledger Agent", responsibilities: ["GL maintenance", "Journal entries", "Period closing"], triggers: ["entry_posted", "period_close", "audit_request"] },
        ],
        outcomes: ["Reconciliation accuracy 99.9%", "Close cycle -50%", "Zero discrepancies"],
      },
      {
        id: "tax_compliance_squad",
        name: "Tax & Compliance Squad",
        mission: "Garantir compliance fiscal e otimização tributária",
        agents: [
          { slug: "tax_compliance", name: "Tax Compliance Agent", responsibilities: ["Obrigações acessórias", "SPED/EFD", "Apuração de impostos"], triggers: ["deadline_approaching", "legislation_change", "monthly_filing"] },
          { slug: "tax_content_agent", name: "Tax Content Writer", responsibilities: ["Conteúdo tributário", "Alertas fiscais", "Newsletter fiscal"], triggers: ["legislation_change", "content_scheduled", "client_question"] },
          { slug: "regulatory_monitor", name: "Regulatory Monitor", responsibilities: ["Regulatory tracking", "Compliance alerts", "Impact analysis"], triggers: ["regulation_published", "deadline_approaching", "industry_change"] },
          { slug: "audit_prep", name: "Audit Preparation Agent", responsibilities: ["Audit documentation", "Evidence collection", "Compliance testing"], triggers: ["audit_scheduled", "evidence_request", "compliance_gap"] },
          { slug: "fiscal_analyst", name: "Fiscal Analyst", responsibilities: ["Tax optimization", "Credit identification", "Fiscal planning"], triggers: ["quarterly_review", "credit_opportunity", "planning_cycle"] },
        ],
        outcomes: ["Compliance 100%", "Tax optimization identified", "Audit readiness always"],
      },
      {
        id: "fpa_squad",
        name: "FP&A Squad",
        mission: "Planejamento financeiro e análise estratégica para crescimento",
        agents: [
          { slug: "ai_cfo", name: "CFO Agent", responsibilities: ["Financial strategy", "Board reporting", "Capital allocation"], triggers: ["board_meeting", "strategic_decision", "quarterly_review"] },
          { slug: "budget_analyst", name: "Budget Analyst", responsibilities: ["Budget creation", "Variance analysis", "Departmental budgets"], triggers: ["budget_cycle", "variance_threshold", "reforecast_needed"] },
          { slug: "financial_forecaster", name: "Financial Forecaster", responsibilities: ["Revenue forecasting", "Scenario modeling", "Cash flow projection"], triggers: ["forecast_cycle", "market_change", "data_update"] },
          { slug: "variance_analyst", name: "Variance Analyst", responsibilities: ["Actual vs budget", "Root cause analysis", "Corrective actions"], triggers: ["period_close", "variance_detected", "management_request"] },
          { slug: "cashflow_monitor", name: "Cash Flow Monitor", responsibilities: ["Cash flow tracking", "Liquidity management", "Working capital"], triggers: ["balance_threshold", "payment_large", "daily_monitoring"] },
        ],
        outcomes: ["Forecast accuracy 90%+", "Cash flow visibility", "Strategic financial clarity"],
      },
      {
        id: "revops_squad",
        name: "Revenue Operations Squad",
        mission: "Otimizar todas as operações de receita e billing",
        agents: [
          { slug: "revenue_ops", name: "Revenue Ops Analyst", responsibilities: ["Revenue analytics", "Billing operations", "Subscription metrics"], triggers: ["mrr_change", "billing_error", "monthly_review"] },
          { slug: "billing_agent", name: "Billing Agent", responsibilities: ["Invoice generation", "Payment processing", "Dunning management"], triggers: ["billing_cycle", "payment_failed", "subscription_change"] },
          { slug: "subscription_mgr", name: "Subscription Manager", responsibilities: ["Subscription lifecycle", "Plan changes", "Renewal processing"], triggers: ["subscription_event", "plan_change", "renewal_due"] },
          { slug: "credit_recovery", name: "Credit Recovery Agent", responsibilities: ["Debt recovery", "Payment negotiation", "Score monitoring"], triggers: ["payment_overdue", "recovery_scheduled", "score_change"] },
          { slug: "pricing_strategy", name: "Pricing Strategy Agent", responsibilities: ["Pricing optimization", "Competitive pricing", "Price elasticity"], triggers: ["market_analysis", "competitor_pricing", "quarterly_review"] },
        ],
        outcomes: ["Revenue leakage <1%", "Collection rate 98%+", "Pricing optimization"],
      },
      {
        id: "procurement_squad",
        name: "Procurement Squad",
        mission: "Otimizar compras e gestão de fornecedores",
        agents: [
          { slug: "procurement", name: "Procurement Agent", responsibilities: ["Purchase orders", "Vendor selection", "Cost negotiation"], triggers: ["purchase_request", "contract_renewal", "budget_allocated"] },
          { slug: "supplier_mgr", name: "Supplier Manager", responsibilities: ["Supplier evaluation", "Performance tracking", "Relationship management"], triggers: ["supplier_review", "quality_issue", "contract_expiring"] },
          { slug: "cost_analyst", name: "Cost Analyst", responsibilities: ["Cost analysis", "TCO calculation", "Savings identification"], triggers: ["cost_review", "budget_threshold", "quarterly_analysis"] },
          { slug: "vendor_evaluator", name: "Vendor Evaluator", responsibilities: ["Vendor scoring", "RFP management", "Comparison analysis"], triggers: ["rfp_issued", "vendor_submitted", "evaluation_due"] },
          { slug: "procurement_negotiator", name: "Contract Negotiator", responsibilities: ["Contract negotiation", "Terms optimization", "Volume discounts"], triggers: ["negotiation_stage", "contract_review", "renewal_approaching"] },
        ],
        outcomes: ["Procurement savings 15%+", "Vendor compliance 95%+", "Cycle time -30%"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 7. OPERATIONS — 25 agents
  // ═══════════════════════════════════════════
  {
    id: "operations",
    name: "Operations",
    color: "text-indigo-400",
    squads: [
      {
        id: "executive_squad",
        name: "Executive Squad",
        mission: "Coordenação estratégica e orquestração de toda a operação",
        agents: [
          { slug: "ceo", name: "CEO Agent", responsibilities: ["Strategic planning", "OKR management", "Cross-department coordination"], triggers: ["strategic_decision", "okr_review", "escalation_critical"] },
          { slug: "orchestrator", name: "Orchestrator", responsibilities: ["Multi-agent coordination", "Workflow management", "Task delegation"], triggers: ["complex_task", "cross_department", "automation_trigger"] },
          { slug: "concierge", name: "Concierge", responsibilities: ["Executive assistance", "Calendar management", "Priority management"], triggers: ["request_received", "schedule_conflict", "priority_change"] },
          { slug: "strategic_planner", name: "Strategic Planner", responsibilities: ["Strategic planning", "Market analysis", "Growth roadmap"], triggers: ["planning_cycle", "market_shift", "board_request"] },
          { slug: "okr_monitor", name: "OKR Monitor", responsibilities: ["OKR tracking", "Progress reporting", "Alignment checks"], triggers: ["okr_update", "progress_review", "quarterly_close"] },
        ],
        outcomes: ["Strategic alignment 90%+", "OKR achievement 80%+", "Execution velocity"],
      },
      {
        id: "legal_squad",
        name: "Legal Squad",
        mission: "Proteger a empresa com compliance jurídico proativo",
        agents: [
          { slug: "contract_analyst", name: "Contract Analyst", responsibilities: ["Contract review", "Risk assessment", "Terms analysis"], triggers: ["contract_received", "review_requested", "deadline_approaching"] },
          { slug: "compliance_officer", name: "Compliance Officer", responsibilities: ["LGPD compliance", "Regulatory adherence", "Policy management"], triggers: ["regulation_change", "audit_scheduled", "compliance_gap"] },
          { slug: "labor_law_agent", name: "Labor Law Agent", responsibilities: ["Labor compliance", "eSocial", "Employee relations"], triggers: ["hr_event", "legislation_change", "dispute_filed"] },
          { slug: "ip_protection", name: "IP Protection Agent", responsibilities: ["IP monitoring", "Trademark protection", "Patent tracking"], triggers: ["infringement_detected", "filing_deadline", "competitor_ip"] },
          { slug: "legal_researcher", name: "Legal Researcher", responsibilities: ["Legal research", "Jurisprudence analysis", "Case law"], triggers: ["research_needed", "legal_question", "case_preparation"] },
        ],
        outcomes: ["Legal risk score low", "Compliance 100%", "Contract turnaround -60%"],
      },
      {
        id: "hr_people_squad",
        name: "HR & People Squad",
        mission: "Atrair, desenvolver e reter talentos de alto desempenho",
        agents: [
          { slug: "recruiter_agent", name: "Recruiter Agent", responsibilities: ["Talent acquisition", "Job postings", "Candidate screening"], triggers: ["position_opened", "application_received", "interview_scheduled"] },
          { slug: "people_analytics", name: "People Analytics", responsibilities: ["HR metrics", "Turnover analysis", "Engagement surveys"], triggers: ["survey_completed", "turnover_spike", "quarterly_review"] },
          { slug: "td_agent", name: "T&D Agent", responsibilities: ["Training programs", "Skill gaps", "Learning paths"], triggers: ["training_needed", "new_hire", "skill_assessment"] },
          { slug: "culture_monitor", name: "Culture Monitor", responsibilities: ["Culture assessment", "Values alignment", "eNPS tracking"], triggers: ["survey_result", "incident_reported", "quarterly_check"] },
          { slug: "employee_experience", name: "Employee Experience Agent", responsibilities: ["EX journey", "Benefits optimization", "Workplace improvements"], triggers: ["feedback_received", "benefit_renewal", "experience_issue"] },
        ],
        outcomes: ["Time-to-hire -40%", "Employee engagement +25%", "Turnover reduction -30%"],
      },
      {
        id: "process_quality_squad",
        name: "Process & Quality Squad",
        mission: "Otimizar processos e garantir qualidade operacional",
        agents: [
          { slug: "process_analyst", name: "Process Analyst", responsibilities: ["Process mapping", "Bottleneck identification", "Automation opportunities"], triggers: ["process_review", "inefficiency_detected", "improvement_request"] },
          { slug: "quality_auditor", name: "Quality Auditor", responsibilities: ["Quality audits", "Standard compliance", "Corrective actions"], triggers: ["audit_scheduled", "quality_issue", "certification_review"] },
          { slug: "sop_writer", name: "SOP Writer", responsibilities: ["Standard Operating Procedures", "Process documentation", "Training materials"], triggers: ["new_process", "process_change", "audit_finding"] },
          { slug: "continuous_improvement", name: "Continuous Improvement Agent", responsibilities: ["Kaizen initiatives", "Lean methodology", "Efficiency metrics"], triggers: ["improvement_opportunity", "waste_identified", "quarterly_review"] },
          { slug: "kpi_dashboard", name: "KPI Dashboard Agent", responsibilities: ["KPI tracking", "Dashboard management", "Performance alerts"], triggers: ["kpi_threshold", "report_requested", "data_update"] },
        ],
        outcomes: ["Process efficiency +35%", "Quality score 98%+", "SOP coverage 100%"],
      },
      {
        id: "logistics_supply_squad",
        name: "Logistics & Supply Chain Squad",
        mission: "Gerenciar logística e cadeia de suprimentos com excelência",
        agents: [
          { slug: "logistics_coordinator", name: "Logistics Coordinator", responsibilities: ["Shipping management", "Route optimization", "Delivery tracking"], triggers: ["order_placed", "delivery_issue", "route_optimization"] },
          { slug: "inventory_manager", name: "Inventory Manager", responsibilities: ["Stock management", "Reorder points", "Demand forecasting"], triggers: ["stock_low", "demand_change", "inventory_audit"] },
          { slug: "supply_chain_analyst", name: "Supply Chain Analyst", responsibilities: ["Supply chain optimization", "Vendor lead times", "Risk assessment"], triggers: ["supply_disruption", "vendor_delay", "cost_analysis"] },
          
          
        ],
        outcomes: ["Delivery time -25%", "Logistics cost -20%", "Inventory accuracy 99%+"],
      },
    ],
  },
  // ═══════════════════════════════════════════
  // 8. SECURITY & COMPLIANCE
  // ═══════════════════════════════════════════
  {
    id: "security",
    name: "Segurança & Compliance",
    color: "text-red-500",
    squads: [
      {
        id: "cyber_defense_squad",
        name: "Cyber Defense Squad",
        mission: "Monitorar e proteger a infraestrutura contra ameaças",
        agents: [
          { slug: "threat_monitor", name: "Threat Monitor", responsibilities: ["Threat detection", "Anomaly analysis", "Alert triage"], triggers: ["anomaly_detected", "alert_fired", "scan_complete"] },
          { slug: "incident_responder", name: "Incident Responder", responsibilities: ["Incident response", "Containment", "Post-mortem"], triggers: ["incident_created", "severity_escalation", "containment_needed"] },
          { slug: "vulnerability_scanner", name: "Vulnerability Scanner", responsibilities: ["Vulnerability scanning", "Patch management", "Risk scoring"], triggers: ["scan_scheduled", "cve_published", "deploy_completed"] },
          { slug: "access_auditor", name: "Access Auditor", responsibilities: ["Access reviews", "Permission audits", "Compliance checks"], triggers: ["review_scheduled", "permission_change", "audit_requested"] },
        ],
        outcomes: ["MTTD <5min", "Zero critical breaches", "Patch compliance 99%+"],
      },
      {
        id: "compliance_squad",
        name: "Compliance Squad",
        mission: "Garantir conformidade regulatória em todas as operações",
        agents: [
          { slug: "gdpr_agent", name: "GDPR Agent", responsibilities: ["GDPR compliance", "Data mapping", "Consent management"], triggers: ["data_request", "consent_change", "audit_scheduled"] },
          { slug: "lgpd_agent", name: "LGPD Agent", responsibilities: ["LGPD compliance", "Data protection", "Privacy assessments"], triggers: ["data_processing", "privacy_request", "regulation_update"] },
          { slug: "soc2_agent", name: "SOC2 Agent", responsibilities: ["SOC2 controls", "Evidence collection", "Audit preparation"], triggers: ["control_review", "audit_approaching", "evidence_needed"] },
        ],
        outcomes: ["Compliance score 100%", "Audit prep time -70%", "Zero violations"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 9. ENGINEERING
  // ═══════════════════════════════════════════
  {
    id: "engineering",
    name: "Engenharia",
    color: "text-cyan-500",
    squads: [
      {
        id: "devops_squad",
        name: "DevOps Squad",
        mission: "Automatizar deploy, infra e CI/CD",
        agents: [
          { slug: "ci_cd_agent", name: "CI/CD Agent", responsibilities: ["Pipeline management", "Build automation", "Deploy orchestration"], triggers: ["push_event", "pr_merged", "build_failed"] },
          { slug: "infra_agent", name: "Infrastructure Agent", responsibilities: ["Cloud provisioning", "Auto-scaling", "Cost optimization"], triggers: ["capacity_threshold", "cost_alert", "infra_request"] },
          { slug: "monitoring_agent", name: "Monitoring Agent", responsibilities: ["System monitoring", "Alert management", "Performance tracking"], triggers: ["metric_anomaly", "alert_triggered", "health_check"] },
          { slug: "release_manager", name: "Release Manager", responsibilities: ["Release planning", "Rollback coordination", "Feature flags"], triggers: ["release_scheduled", "rollback_needed", "feature_toggle"] },
        ],
        outcomes: ["Deploy frequency 10x", "MTTR <15min", "Infra cost -30%"],
      },
      {
        id: "qa_squad",
        name: "QA & Testing Squad",
        mission: "Garantir qualidade e cobertura de testes em toda a plataforma",
        agents: [
          { slug: "test_automation_agent", name: "Test Automation Agent", responsibilities: ["Test automation", "E2E testing", "Regression suites"], triggers: ["code_change", "release_candidate", "bug_reported"] },
          { slug: "performance_tester", name: "Performance Tester", responsibilities: ["Load testing", "Stress testing", "Bottleneck identification"], triggers: ["pre_release", "performance_alert", "scale_event"] },
          { slug: "security_tester", name: "Security Tester", responsibilities: ["Penetration testing", "Security scanning", "Vulnerability assessment"], triggers: ["deploy_completed", "security_review", "new_feature"] },
        ],
        outcomes: ["Test coverage 95%+", "Bug escape rate <1%", "Performance SLA 99.9%"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 10. DATA & ANALYTICS
  // ═══════════════════════════════════════════
  {
    id: "data_analytics",
    name: "Data & Analytics",
    color: "text-indigo-500",
    squads: [
      {
        id: "data_engineering_squad",
        name: "Data Engineering Squad",
        mission: "Construir e manter pipelines de dados confiáveis",
        agents: [
          { slug: "etl_agent", name: "ETL Agent", responsibilities: ["Data pipelines", "ETL processes", "Data quality"], triggers: ["pipeline_scheduled", "data_error", "source_added"] },
          { slug: "data_warehouse_agent", name: "Data Warehouse Agent", responsibilities: ["Warehouse management", "Schema design", "Query optimization"], triggers: ["schema_change", "query_slow", "storage_threshold"] },
          { slug: "data_quality_agent", name: "Data Quality Agent", responsibilities: ["Data validation", "Anomaly detection", "Quality scoring"], triggers: ["ingestion_complete", "quality_alert", "validation_failed"] },
        ],
        outcomes: ["Data freshness <1h", "Quality score 99%+", "Pipeline uptime 99.9%"],
      },
      {
        id: "bi_squad",
        name: "Business Intelligence Squad",
        mission: "Transformar dados em insights acionáveis para o negócio",
        agents: [
          { slug: "bi_analyst", name: "BI Analyst", responsibilities: ["Dashboard creation", "Report automation", "Insight generation"], triggers: ["report_requested", "metric_anomaly", "period_close"] },
          { slug: "predictive_agent", name: "Predictive Analytics Agent", responsibilities: ["Predictive modeling", "Forecasting", "Trend analysis"], triggers: ["model_scheduled", "data_updated", "forecast_requested"] },
          { slug: "ab_test_agent", name: "A/B Test Agent", responsibilities: ["Experiment design", "Statistical analysis", "Winner selection"], triggers: ["experiment_created", "sample_reached", "test_concluded"] },
        ],
        outcomes: ["Decision speed +50%", "Forecast accuracy 90%+", "Test velocity 3x"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 11. COMUNICAÇÃO & PR
  // ═══════════════════════════════════════════
  {
    id: "communications",
    name: "Comunicação & PR",
    color: "text-pink-500",
    squads: [
      {
        id: "pr_squad",
        name: "Public Relations Squad",
        mission: "Gerenciar reputação e relações com a mídia",
        agents: [
          { slug: "media_relations_agent", name: "Media Relations Agent", responsibilities: ["Press releases", "Media outreach", "Interview prep"], triggers: ["news_event", "press_request", "launch_scheduled"] },
          { slug: "crisis_comms_agent", name: "Crisis Communications Agent", responsibilities: ["Crisis management", "Response coordination", "Stakeholder comms"], triggers: ["crisis_detected", "negative_press", "incident_public"] },
          { slug: "social_listening_agent", name: "Social Listening Agent", responsibilities: ["Brand monitoring", "Sentiment analysis", "Trend spotting"], triggers: ["mention_spike", "sentiment_shift", "competitor_news"] },
        ],
        outcomes: ["Media coverage +60%", "Crisis response <1h", "Brand sentiment 85%+"],
      },
      {
        id: "internal_comms_squad",
        name: "Internal Communications Squad",
        mission: "Manter toda a empresa informada e alinhada",
        agents: [
          { slug: "newsletter_agent", name: "Newsletter Agent", responsibilities: ["Internal newsletters", "Company updates", "Culture content"], triggers: ["update_scheduled", "milestone_achieved", "announcement_needed"] },
          { slug: "employee_engagement_agent", name: "Employee Engagement Agent", responsibilities: ["Engagement surveys", "Pulse checks", "Action plans"], triggers: ["survey_scheduled", "engagement_drop", "feedback_received"] },
        ],
        outcomes: ["Internal NPS 80+", "Update reach 95%+", "Engagement score +25%"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 12. TALENT & PEOPLE
  // ═══════════════════════════════════════════
  {
    id: "talent",
    name: "Talent & People",
    color: "text-amber-500",
    squads: [
      {
        id: "recruiting_squad",
        name: "Recruiting Squad",
        mission: "Atrair e selecionar os melhores talentos do mercado",
        agents: [
          { slug: "sourcing_agent", name: "Sourcing Agent", responsibilities: ["Candidate sourcing", "Pipeline building", "Outreach campaigns"], triggers: ["role_opened", "pipeline_low", "referral_received"] },
          { slug: "screening_agent", name: "Screening Agent", responsibilities: ["Resume screening", "Qualification assessment", "Interview scheduling"], triggers: ["application_received", "screening_queue", "interview_requested"] },
          { slug: "employer_brand_agent", name: "Employer Brand Agent", responsibilities: ["Employer branding", "Careers content", "Glassdoor management"], triggers: ["review_posted", "content_scheduled", "campaign_launch"] },
        ],
        outcomes: ["Time-to-hire -40%", "Quality of hire +35%", "Offer acceptance 90%+"],
      },
      {
        id: "people_ops_squad",
        name: "People Ops Squad",
        mission: "Gerenciar ciclo de vida do colaborador com excelência",
        agents: [
          { slug: "payroll_agent", name: "Payroll Agent", responsibilities: ["Payroll processing", "Benefits admin", "Tax compliance"], triggers: ["payroll_cycle", "benefit_change", "tax_deadline"] },
          { slug: "performance_agent", name: "Performance Agent", responsibilities: ["Performance reviews", "Goal tracking", "Feedback cycles"], triggers: ["review_cycle", "goal_deadline", "feedback_due"] },
          { slug: "offboarding_agent", name: "Offboarding Agent", responsibilities: ["Exit process", "Knowledge transfer", "Access revocation"], triggers: ["resignation_received", "termination_approved", "last_day_approaching"] },
        ],
        outcomes: ["Payroll accuracy 100%", "Review completion 98%+", "Offboarding SLA met"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 13. INOVAÇÃO & R&D
  // ═══════════════════════════════════════════
  {
    id: "innovation",
    name: "Inovação & R&D",
    color: "text-violet-500",
    squads: [
      {
        id: "research_squad",
        name: "Research Squad",
        mission: "Pesquisar e experimentar novas tecnologias e modelos",
        agents: [
          { slug: "tech_scout", name: "Tech Scout", responsibilities: ["Technology research", "Trend analysis", "Competitive intel"], triggers: ["research_scheduled", "tech_trend", "competitor_launch"] },
          { slug: "prototype_agent", name: "Prototype Agent", responsibilities: ["Rapid prototyping", "POC development", "Feasibility studies"], triggers: ["idea_approved", "prototype_requested", "poc_deadline"] },
          { slug: "patent_agent", name: "Patent Agent", responsibilities: ["Patent research", "IP protection", "Filing management"], triggers: ["invention_disclosed", "patent_search", "filing_deadline"] },
        ],
        outcomes: ["Innovation pipeline 20+ ideas/quarter", "POC speed <2 weeks", "IP portfolio growth"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 14. IT & INFRAESTRUTURA
  // ═══════════════════════════════════════════
  {
    id: "it_infrastructure",
    name: "IT & Infraestrutura",
    color: "text-slate-500",
    squads: [
      {
        id: "it_support_squad",
        name: "IT Support Squad",
        mission: "Manter todos os sistemas operacionais e usuários produtivos",
        agents: [
          { slug: "helpdesk_agent", name: "Helpdesk Agent", responsibilities: ["IT support", "Ticket resolution", "User assistance"], triggers: ["ticket_created", "user_request", "system_issue"] },
          { slug: "asset_manager", name: "Asset Manager", responsibilities: ["Asset tracking", "License management", "Procurement"], triggers: ["asset_request", "license_expiring", "inventory_review"] },
          { slug: "network_agent", name: "Network Agent", responsibilities: ["Network monitoring", "Connectivity issues", "VPN management"], triggers: ["network_alert", "connectivity_issue", "config_change"] },
        ],
        outcomes: ["Ticket resolution <4h", "System uptime 99.9%", "Asset utilization +20%"],
      },
      {
        id: "cloud_ops_squad",
        name: "Cloud Operations Squad",
        mission: "Otimizar custos e performance da infraestrutura cloud",
        agents: [
          { slug: "cloud_cost_agent", name: "Cloud Cost Agent", responsibilities: ["Cost optimization", "Resource rightsizing", "Budget alerts"], triggers: ["cost_spike", "budget_threshold", "monthly_review"] },
          { slug: "backup_agent", name: "Backup & Recovery Agent", responsibilities: ["Backup management", "Disaster recovery", "RTO/RPO monitoring"], triggers: ["backup_scheduled", "recovery_test", "failure_detected"] },
        ],
        outcomes: ["Cloud cost -25%", "RTO <30min", "Backup success 100%"],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 15. ESTRATÉGIA & INTELIGÊNCIA DE MERCADO
  // ═══════════════════════════════════════════
  {
    id: "strategy",
    name: "Estratégia & Inteligência",
    color: "text-emerald-600",
    squads: [
      {
        id: "market_intel_squad",
        name: "Market Intelligence Squad",
        mission: "Fornecer inteligência de mercado para decisões estratégicas",
        agents: [
          { slug: "competitive_analyst", name: "Competitive Analyst", responsibilities: ["Competitive analysis", "Market mapping", "Threat assessment"], triggers: ["competitor_update", "market_shift", "strategy_review"] },
          { slug: "market_researcher", name: "Market Researcher", responsibilities: ["Market research", "Industry reports", "Opportunity sizing"], triggers: ["research_requested", "industry_event", "quarterly_review"] },
          { slug: "pricing_strategist", name: "Pricing Strategist", responsibilities: ["Pricing analysis", "Elasticity modeling", "Revenue optimization"], triggers: ["pricing_review", "competitor_price_change", "margin_alert"] },
        ],
        outcomes: ["Market insight latency <24h", "Pricing accuracy +20%", "Strategic alignment 95%+"],
      },
      {
        id: "expansion_squad",
        name: "Expansion & New Markets Squad",
        mission: "Identificar e validar oportunidades de expansão",
        agents: [
          { slug: "geo_expansion_agent", name: "Geo Expansion Agent", responsibilities: ["Market entry analysis", "Localization planning", "Regulatory mapping"], triggers: ["expansion_proposed", "market_validated", "regulatory_change"] },
          { slug: "m_and_a_analyst", name: "M&A Analyst", responsibilities: ["Acquisition analysis", "Due diligence", "Integration planning"], triggers: ["target_identified", "dd_started", "deal_stage_change"] },
        ],
        outcomes: ["Expansion success rate 80%+", "DD speed +50%", "Market entry cost -30%"],
      },
    ],
  },
];

// ─── Computed totals ───
export const TOTAL_WORKFORCE_AGENTS = WORKFORCE.reduce(
  (sum, dept) => sum + dept.squads.reduce((s, sq) => s + sq.agents.length, 0), 0
);

export const TOTAL_SQUADS = WORKFORCE.reduce(
  (sum, dept) => sum + dept.squads.length, 0
);

export const TOTAL_DEPARTMENTS = WORKFORCE.length;

// ─── Flat list of all agent slugs ───
export const ALL_AGENT_SLUGS = WORKFORCE.flatMap(
  dept => dept.squads.flatMap(sq => sq.agents.map(a => a.slug))
);

// ─── Quick lookup: slug → department ───
export const SLUG_TO_WORKFORCE_DEPT: Record<string, string> = {};
for (const dept of WORKFORCE) {
  for (const sq of dept.squads) {
    for (const agent of sq.agents) {
      SLUG_TO_WORKFORCE_DEPT[agent.slug] = dept.id;
    }
  }
}
