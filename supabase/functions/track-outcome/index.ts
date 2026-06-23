import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  outcome_type: z.enum([
    'lead_qualified',
    'meeting_booked',
    'contract_signed',
    'sale_closed',
    'document_generated',
    'task_completed',
    'custom',
  ]),
  agent_id: z.string().uuid().optional(),
  agent_slug: z.string().min(1).max(120).optional(),
  reference_id: z.string().max(255).optional(),
  value_brl: z.number().nonnegative().default(0),
  metadata: z.record(z.unknown()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the JWT and get user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    // Parse + validate body
    const raw = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const body = parsed.data;

    // Resolve tenant via service role (bypasses RLS for lookup)
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: tenantRow, error: tenantErr } = await admin
      .from('tenant_members')
      .select('tenant_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (tenantErr || !tenantRow) {
      return new Response(JSON.stringify({ error: 'No tenant for this user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert event — BEFORE INSERT trigger computes the charge
    const { data: inserted, error: insertErr } = await admin
      .from('outcome_events')
      .insert({
        tenant_id: tenantRow.tenant_id,
        user_id: userId,
        agent_id: body.agent_id ?? null,
        agent_slug: body.agent_slug ?? null,
        outcome_type: body.outcome_type,
        reference_id: body.reference_id ?? null,
        value_brl: body.value_brl,
        metadata: body.metadata ?? {},
      })
      .select('id, computed_charge_brl, status, pricing_rule_id')
      .single();

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, event: inserted }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
