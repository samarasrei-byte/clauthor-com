import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

const agentDemos: Record<string, ChatMessage[]> = {
  voice_ai: [
    { role: "user", text: "I need to call 50 qualified leads today." },
    { role: "agent", text: "Starting auto-dialer. Priority: leads score > 80. First call in 3s... 📞" },
    { role: "user", text: "What if the lead doesn't answer?" },
    { role: "agent", text: "Auto-scheduling callback in 2h and sending personalized SMS. Reconnection rate: 73%." },
  ],
  orchestrator: [
    { role: "user", text: "I need a financial report + market analysis." },
    { role: "agent", text: "Delegating to CFO Agent (financial) and Research Agent (market). ETA: 4 min." },
    { role: "agent", text: "✅ CFO: report ready. ✅ Research: analysis complete. Consolidating..." },
  ],
  coding: [
    { role: "user", text: "There's a bug in checkout, customers can't complete purchases." },
    { role: "agent", text: "Analyzing logs... Found: timeout in payment API (line 247). Fixing and opening PR." },
    { role: "agent", text: "PR #142 opened with fix + unit test. Pipeline green. ✅" },
  ],
  sales: [
    { role: "user", text: "What's the pipeline status this month?" },
    { role: "agent", text: "47 active opportunities. $380k in forecast. 12 deals to close this week. Follow-ups scheduled." },
  ],
  omnichannel: [
    { role: "user", text: "Customer complaining on WhatsApp about a delay." },
    { role: "agent", text: "Identified order #4521. Tracking shows delivery tomorrow. Replied with tracking link and apology coupon." },
  ],
  content: [
    { role: "user", text: "I need posts for Black Friday." },
    { role: "agent", text: "Created: 5 Instagram carousels, 3 reels with copy, 10 stories with countdown. Scheduled Nov 20-29. 🎯" },
  ],
  security: [
    { role: "user", text: "Did you run the vulnerability scan?" },
    { role: "agent", text: "Scan complete. 0 critical, 2 medium (outdated deps). Fix PRs already opened. Compliance report updated. 🛡️" },
  ],
  revenue: [
    { role: "user", text: "How's the cash flow?" },
    { role: "agent", text: "Positive at $142k. 90-day forecast: stable. 3 invoices due Friday — reminders sent automatically. 💰" },
  ],
  customer_success: [
    { role: "user", text: "Any customers at risk of churning?" },
    { role: "agent", text: "3 accounts with health score < 40. Already initiated retention playbook: personalized call + exclusive offer scheduled." },
  ],
  hr: [
    { role: "user", text: "How's the hiring process going?" },
    { role: "agent", text: "45 CVs screened, 12 interviews scheduled. Top 3 candidates with cultural fit > 90%. Report sent to your email. 📋" },
  ],
  data_analytics: [
    { role: "user", text: "Which product sells most on Tuesdays?" },
    { role: "agent", text: "Product A: +47% on Tuesdays vs average. Correlation with email campaign (sent Monday 6 PM). Recommend replicating pattern. 📊" },
  ],
  legal: [
    { role: "user", text: "Can you review this vendor contract?" },
    { role: "agent", text: "Analyzed. 3 risk clauses identified: disproportionate penalty (§4.2), unfavorable venue (§12), ambiguous IP (§7). Draft suggestions ready. ⚖️" },
  ],
  ecommerce: [
    { role: "user", text: "Which products need restocking?" },
    { role: "agent", text: "7 SKUs with stock < 3 days. Auto-reorder generated. Demand forecast updated for next 30 days. 📦" },
  ],
  marketing_automation: [
    { role: "user", text: "How's the nurture campaign doing?" },
    { role: "agent", text: "Active sequence: 2,340 leads. Open rate: 42% (above benchmark). 89 MQLs ready for sales. Notifying the team. 🎯" },
  ],
  tax_content: [
    { role: "user", text: "I need content about the new tax regulation." },
    { role: "agent", text: "Created: 3 articles on tax updates, compliance guides, and regulatory changes. Accessible language, legal references included. Scheduled on blog. 📋" },
  ],
  copywriting: [
    { role: "user", text: "I need copy for the course sales page." },
    { role: "agent", text: "Tested headline: 'From $0 to $50k/mo in 90 days'. 3 VSL variations, 5 CTAs with progressive urgency. Estimated conversion: 4.2%. ✍️" },
  ],
  positioning: [
    { role: "user", text: "How to position our brand in the premium market?" },
    { role: "agent", text: "Competitive analysis ready. 3 brand territories identified. Recommend: 'expertise + exclusivity'. Brand manifesto and tone of voice created. 🎯" },
  ],
  branding: [
    { role: "user", text: "We need to update our visual identity." },
    { role: "agent", text: "Brand audit completed. Proposal: updated palette (3 colors), premium typography, application guidelines. Moodboard approved internally. 🎨" },
  ],
  public_relations: [
    { role: "user", text: "A negative article about us was published." },
    { role: "agent", text: "Active monitoring. Official statement drafted and sent to 12 outlets. 3 positive stories scheduled. Sentiment already reversing on social. 📰" },
  ],
  social_proof: [
    { role: "user", text: "I need more customer testimonials." },
    { role: "agent", text: "Sent NPS survey to 340 customers. 47 responses scored 9-10 collected. 12 cases formatted with before/after. Social proof carousel ready. ⭐" },
  ],
  events_speaker: [
    { role: "user", text: "We have an event in 30 days, need to organize everything." },
    { role: "agent", text: "Checklist created: 84 items. Speakers confirmed (3/5). Landing page published. Email marketing scheduled in 3 waves. 120 tickets sold. 🎤" },
  ],
  sdr_social: [
    { role: "user", text: "I need to prospect on Instagram and TikTok." },
    { role: "agent", text: "247 ICP profiles mapped. 89 personalized DMs sent. Response rate: 23%. 12 calls scheduled this week. 📱" },
  ],
  sdr_linkedin: [
    { role: "user", text: "I want to reach tech decision-makers." },
    { role: "agent", text: "List of 180 CTOs/VPs segmented. 4-touchpoint sequence active. 34 connections accepted today. 8 interested for call. 💼" },
  ],
  sdr_instagram: [
    { role: "user", text: "How's Instagram prospecting going?" },
    { role: "agent", text: "Story polls: 1.2k responses. 89 qualified leads via DM. Active funnel: 23 in negotiation. Next: live with exclusive offer. 📸" },
  ],
  sdr_whatsapp: [
    { role: "user", text: "Send today's lead list." },
    { role: "agent", text: "142 leads contacted via WhatsApp. 67 responded. 28 qualified (BANT). 9 appointments confirmed. Auto follow-up in 2h. 💬" },
  ],
  sdr_outbound: [
    { role: "user", text: "I need 50 meetings this month." },
    { role: "agent", text: "Goal: 50 meetings. Active cadence: 800 prospects. 340 emails sent today. 12 positive replies. Projection: 54 meetings. 🎯" },
  ],
  sdr_inbound: [
    { role: "user", text: "How many leads came from the website today?" },
    { role: "agent", text: "78 leads captured. 45 auto-qualified (score > 70). 12 forwarded to closers. Avg response time: 47 seconds. ⚡" },
  ],
  sdr_database: [
    { role: "user", text: "I need to enrich my lead database." },
    { role: "agent", text: "Database updated: 4,200 contacts. 890 emails validated. 340 new phone numbers found. 67 ideal-fit companies identified. 🔍" },
  ],
  sdr_events: [
    { role: "user", text: "There's a tech conference next week." },
    { role: "agent", text: "Attendee list obtained: 2,300 companies. 180 pre-appointments via email. QR code for booth capture configured. D+1 follow-up scheduled. 🏢" },
  ],
  sdr_partnerships: [
    { role: "user", text: "I want to expand via partnership channels." },
    { role: "agent", text: "45 potential partners mapped. 12 co-marketing proposals sent. 3 deals in negotiation. Projected revenue: $89k/mo via channel. 🤝" },
  ],
  pre_qualifier: [
    { role: "user", text: "Too many bad leads reaching the closer." },
    { role: "agent", text: "BANT+ICP filter activated. Of 200 leads, 34 passed (17%). Saving 40h/mo of sales team time. Avg qualified score: 87. ✅" },
  ],
  hunter: [
    { role: "user", text: "I need to open the healthcare market." },
    { role: "agent", text: "340 clinics/hospitals mapped. ICP refined: 50+ beds, revenue > $5M. 23 first contacts made. 5 meetings scheduled. 🏥" },
  ],
  farmer: [
    { role: "user", text: "How's the current base expansion?" },
    { role: "agent", text: "Portfolio health score: 82/100. 12 upsells identified ($234k potential). 3 early renewals. Predicted churn: 2.1% (goal: 3%). 🌱" },
  ],
  contract_analyst: [
    { role: "user", text: "Review this licensing contract?" },
    { role: "agent", text: "Analyzed. 4 risk clauses: abusive penalty (§3.1), auto-renewal without notice (§8), IP transfer (§5.2), unfavorable venue (§12). Suggestions ready. 📋" },
  ],
  compliance_officer: [
    { role: "user", text: "Are we in compliance with data protection regulations?" },
    { role: "agent", text: "Full scan: 3 gaps identified — incomplete cookie consent, missing retention policy, DPO not appointed. Action plan generated. 🛡️" },
  ],
  labor_law: [
    { role: "user", text: "Calculate the severance for employee John." },
    { role: "agent", text: "Severance calculated: PTO payout ($4,200), notice period (30d), prorated bonus. Total: $18,720. Documentation generated. ⚖️" },
  ],
  litigation: [
    { role: "user", text: "How many active lawsuits do we have?" },
    { role: "agent", text: "47 active cases. 3 with deadlines this week (response due). Total financial risk: $890k. Defense brief for case #23 already drafted. ⚖️" },
  ],
  procurement: [
    { role: "user", text: "I need to buy 500 laptops for the team." },
    { role: "agent", text: "3 quotes obtained: Dell ($3,200/unit), Lenovo ($3,050/unit), HP ($3,380/unit). Lenovo has best TCO. 8% savings vs last purchase. Order ready. 📦" },
  ],
  supplier_mgr: [
    { role: "user", text: "How's our supplier scorecard?" },
    { role: "agent", text: "45 active suppliers. 38 with score > 80. 3 below SLA (delivery delayed > 15%). Alert sent + meeting scheduled with all 3. 🏭" },
  ],
  cost_analyst: [
    { role: "user", text: "Where are we overspending vs budget?" },
    { role: "agent", text: "3 cost centers over budget: IT (+18%), Marketing (+12%), Facilities (+7%). Main driver: unused SaaS licenses ($34k/mo). 💰" },
  ],
  contract_negotiator: [
    { role: "user", text: "I need to renegotiate the AWS contract." },
    { role: "agent", text: "Benchmark: similar companies pay 22% less. Playbook prepared: committed use discount + reserved instances. Projected savings: $180k/year. 🤝" },
  ],
  logistics: [
    { role: "user", text: "How to optimize deliveries in the metro area?" },
    { role: "agent", text: "Route optimization: 23 routes consolidated to 15. 31% fuel savings. Avg delivery time: 2.1h → 1.4h. Active tracking enabled. 🚛" },
  ],
  inventory: [
    { role: "user", text: "Any products at risk of stockout?" },
    { role: "agent", text: "12 SKUs with stock < 5 days. 3 critical (ABC class A). Auto-reorders sent. Demand forecast updated for 60 days. 📦" },
  ],
  quality: [
    { role: "user", text: "When's the next ISO audit?" },
    { role: "agent", text: "ISO 9001 audit in 45 days. Checklist: 89% compliant. 4 non-conformities open — 2 with corrective action. Pre-audit report generated. ✅" },
  ],
  process_analyst: [
    { role: "user", text: "The onboarding process is too slow." },
    { role: "agent", text: "BPMN mapping: 23 steps, 5 bottlenecks identified. Lean proposal: eliminate 8 steps, automate 4. Estimated time: 12 days → 4 days. ⚙️" },
  ],
};

const defaultDemo: ChatMessage[] = [
  { role: "user", text: "What can you do for me?" },
  { role: "agent", text: "I can automate your tasks, generate reports, and make data-driven decisions. All 24/7, no breaks. 🚀" },
];

interface AgentMiniChatProps {
  agentKey: string;
  agentName: string;
}

export default function AgentMiniChat({ agentKey, agentName }: AgentMiniChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messages = agentDemos[agentKey] || defaultDemo;

  useEffect(() => {
    if (!isOpen) {
      setVisibleCount(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    setVisibleCount(1);
    let count = 1;
    intervalRef.current = setInterval(() => {
      count++;
      if (count > messages.length) {
        count = 0;
        setVisibleCount(0);
        setTimeout(() => setVisibleCount(1), 800);
        return;
      }
      setVisibleCount(count);
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, messages.length]);

  return (
    <div className="mt-auto">
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className="w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/25 transition-colors text-[10px]"
      >
        <span className="flex items-center gap-1.5 text-primary/70 font-medium">
          <MessageSquare className="h-3 w-3" />
          Live demo
        </span>
        {isOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 p-2.5 rounded-lg bg-background/60 border border-border/40 space-y-1.5 max-h-36 overflow-y-auto">
              <AnimatePresence>
                {messages.slice(0, visibleCount).map((msg, idx) => (
                  <motion.div
                    key={`${agentKey}-${idx}-${visibleCount}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-1.5 ${msg.role === "user" ? "justify-end" : ""}`}
                  >
                    {msg.role === "agent" && (
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-2 w-2 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-2 py-1 rounded-lg text-[10px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary/10 text-foreground/80"
                        : "bg-white/[0.03] text-foreground/70 border border-white/[0.04]"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleCount > 0 && visibleCount < messages.length && (
                <div className="flex items-center gap-1 pt-0.5">
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[8px] text-muted-foreground">{agentName.split("—")[0].trim()} typing...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
