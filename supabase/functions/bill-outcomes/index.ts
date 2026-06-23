import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * bill-outcomes
 *
 * Runs (typically via pg_cron monthly) to consolidate all `pending` outcome
 * events into a `billed` state and produce a per-tenant invoice summary.
 *
 * Today it marks events as `billed` and writes a `payment_history` row of
 * type `outcome_invoice` per tenant. PayPal charge creation can be wired
 * in a follow-up by invoking `paypal-checkout` with the totals below.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch all pending events with a computed charge > 0
    const { data: pending, error: fetchErr } = await admin
      .from('outcome_events')
      .select('id, tenant_id, user_id, computed_charge_brl')
      .eq('status', 'pending')
      .gt('computed_charge_brl', 0);

    if (fetchErr) throw fetchErr;
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ ok: true, billed: 0, tenants: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group by tenant
    const byTenant = new Map<string, { user_id: string; ids: string[]; total: number }>();
    for (const ev of pending) {
      const key = ev.tenant_id as string;
      const entry = byTenant.get(key) ?? { user_id: ev.user_id as string, ids: [], total: 0 };
      entry.ids.push(ev.id as string);
      entry.total += Number(ev.computed_charge_brl ?? 0);
      byTenant.set(key, entry);
    }

    const now = new Date().toISOString();
    let billed = 0;

    for (const [tenantId, agg] of byTenant.entries()) {
      // Mark events as billed
      const { error: updErr } = await admin
        .from('outcome_events')
        .update({ status: 'billed', billed_at: now })
        .in('id', agg.ids);
      if (updErr) {
        console.error('[bill-outcomes] update failed', tenantId, updErr.message);
        continue;
      }

      // Write invoice row
      await admin.from('payment_history').insert({
        user_id: agg.user_id,
        type: 'outcome_invoice',
        item_id: tenantId,
        item_name: `Outcome invoice — ${agg.ids.length} events`,
        amount_cents: Math.round(agg.total * 100),
        currency: 'BRL',
        status: 'pending',
        tokens_amount: 0,
        metadata: { tenant_id: tenantId, event_ids: agg.ids, period_end: now },
      });

      billed += agg.ids.length;
    }

    return new Response(
      JSON.stringify({ ok: true, billed, tenants: byTenant.size }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
