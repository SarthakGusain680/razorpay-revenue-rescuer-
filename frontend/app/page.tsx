"use client";

import { useCallback, useEffect, useState } from "react";

const API = "";

type Intervention = {
  action: string;
  message: string;
  reasoning: string;
  status: string;
};

type Cart = {
  id: number;
  user_email: string;
  cart_value: number;
  items: string[];
  status: string;
  interventions: Intervention[];
};

type Dashboard = {
  total_abandoned: number;
  total_recovered_count: number;
  total_money_recovered: number;
  carts: Cart[];
};

const randomPool = [
  { user_email: "arjun@example.com", user_phone: "+91 98123 45678", cart_value: 2499, items: ["Boat Headphones"], customer_type: "New" },
  { user_email: "meera@example.com", user_phone: "+91 99887 76655", cart_value: 8999, items: ["Smart Watch Pro"], customer_type: "Returning" },
  { user_email: "kabir@example.com", user_phone: "+91 91234 56780", cart_value: 15999, items: ["Running Shoes", "Yoga Mat"], customer_type: "New" },
  { user_email: "ananya@example.com", user_phone: "+91 93456 78901", cart_value: 5499, items: ["Handbag"], customer_type: "Returning" },
];

function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    let frame: number;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Recovered" || status === "Sent"
      ? "text-sage border-sage/30 bg-sage/10"
      : status === "Pending"
      ? "text-amber border-amber/30 bg-amber/10"
      : "text-cream/60 border-cream/20 bg-cream/5";
  return (
    <span className={`text-[11px] tracking-wide border rounded-full px-2.5 py-0.5 ${styles}`}>
      {status}
    </span>
  );
}

export default function Home() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [batchStats, setBatchStats] = useState<{total_recovered: number; total_value_at_risk: number; recovery_rate: number} | null>(null);

  const fetchDashboard = useCallback(async () => {
    const timer = setTimeout(() => setSlow(true), 2000);
    try {
      const res = await fetch(`${API}/api/dashboard`);
      if (!res.ok) throw new Error("Backend error " + res.status);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Could not reach the recovery engine.");
    } finally {
      clearTimeout(timer);
      setSlow(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  async function simulateCart() {
    setBusy("simulate");
    const pick = randomPool[Math.floor(Math.random() * randomPool.length)];
    try {
       await fetch(`${API}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pick),
      });
      await fetchDashboard();
    } finally {
      setBusy(null);
    }
  }
  async function simulateBatch() {
  setBusy("batch");
  try {
    const res = await fetch(`${API}/api/simulate-batch`, { method: "POST" });
    if (!res.ok) throw new Error("batch failed");
    const data = await res.json();
  setBatchStats({
    total_recovered: data.total_recovered,
    total_value_at_risk: data.total_value_at_risk,
    recovery_rate: data.recovery_rate,
  });
    await fetchDashboard();
  } catch (e) {
    alert("Batch simulation failed");
  } finally {
    setBusy(null);
  }
}

  async function intervene(cartId: number) {
    setBusy(`intervene-${cartId}`);
    try {
      await fetch(`${API}/api/intervene/${cartId}`, { method: "POST" });
      await fetchDashboard();
    } finally {
      setBusy(null);
    }
  }

  async function recover(cartId: number) {
    setBusy(`recover-${cartId}`);
    try {
      await fetch(`${API}/api/recover/${cartId}`, { method: "POST" });
      await fetchDashboard();
    } finally {
      setBusy(null);
    }
  }

  const carts = data?.carts ?? [];
  const animatedMoney = useCountUp(data?.total_money_recovered ?? 0);

  return (
    <main className="min-h-screen bg-ink text-cream font-body">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_-10%,rgba(217,160,91,0.10),transparent)]" />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-8">
        <header className="rise flex items-center justify-between mb-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cream text-ink flex items-center justify-center font-display text-lg">
              ₹
            </div>
            <span className="font-semibold tracking-tight">Revenue Rescuer</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <span className="hidden md:inline">/ buildathon 2026</span>
            <span className="flex items-center gap-2 text-cream">
              <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
              live
            </span>
          </div>
        </header>

        <section className="mb-20">
          <p className="rise text-sm text-muted mb-6" style={{ animationDelay: "100ms" }}>
            / Track 03 — AI Revenue Recovery
          </p>
          <h1
            className="rise font-display text-6xl md:text-8xl leading-[0.95] tracking-tight"
            style={{ animationDelay: "200ms" }}
          >
            Lost revenue,
            <br />
            <em className="text-amber">recovered.</em>
          </h1>
          <p
            className="rise mt-8 max-w-xl text-muted leading-relaxed"
            style={{ animationDelay: "350ms" }}
          >
            An AI agent that detects abandoned checkouts, intervenes politely, and wins
            the money back — every action bounded, compliant, and explained.
          </p>
          <button
            onClick={simulateCart}
            disabled={busy !== null}
            className="rise mt-10 inline-flex items-center gap-3 bg-cream text-ink font-semibold px-6 py-3 rounded-lg hover:bg-amber transition-colors duration-300 disabled:opacity-50"
            style={{ animationDelay: "450ms" }}
          >
            {busy === "simulate" ? "AI is deciding…" : "+ simulate abandoned cart"}
          </button>
          <button
            onClick={simulateBatch}
            disabled={busy === "batch"}
            className="bg-amber text-ink font-semibold px-6 py-3 rounded-lg hover:bg-cream transition disabled:opacity-50 ml-4"
            >
  {busy === "batch" ? "Processing 20 carts…" : "+ simulate batch (20 carts)"}
</button>
        </section>

        <section className="rise grid grid-cols-1 md:grid-cols-3 gap-px bg-cream/10 border border-cream/10 rounded-2xl overflow-hidden mb-16" style={{ animationDelay: "500ms" }}>
          <div className="bg-ink p-8 hover:bg-panel transition-colors duration-300">
            <p className="text-sm text-muted mb-3">/ abandoned carts</p>
            <p className="font-display text-5xl">{data?.total_abandoned ?? 0}</p>
          </div>
          <div className="bg-ink p-8 hover:bg-panel transition-colors duration-300">
            <p className="text-sm text-muted mb-3">/ carts recovered</p>
            <p className="font-display text-5xl">{data?.total_recovered_count ?? 0}</p>
          </div>
          <div className="bg-ink p-8 hover:bg-panel transition-colors duration-300">
            <p className="text-sm text-muted mb-3">/ money recovered</p>
            <p className="font-display text-5xl text-sage">₹{animatedMoney.toLocaleString("en-IN")}</p>
          </div>
        </section>

        <section className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted">/ live audit trail</p>
            <p className="text-xs text-muted">every action, explained</p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-cream/10 bg-panel/60 p-10 text-center">
              <p className="text-cream/80">
                <span className="inline-block w-2 h-2 rounded-full bg-amber animate-pulse mr-3" />
                waking up the recovery engine…
              </p>
              {slow && <p className="text-xs text-muted mt-3">serverless cold start — one moment</p>}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-amber/30 bg-amber/5 p-10 text-center">
              <p className="text-cream/80 mb-4">
                {error} Is the backend running on port 8000?
              </p>
              <button
                onClick={fetchDashboard}
                className="border border-cream/20 rounded-lg px-5 py-2 text-sm hover:bg-cream/5 transition"
              >
                retry
              </button>
            </div>
          ) : carts.length === 0 ? (
            <div className="rounded-2xl border border-cream/10 bg-panel/60 p-10 text-center text-muted">
              / no carts yet — press “+ simulate abandoned cart” above
            </div>
          ) : (
            <div className="space-y-4">
              {carts.map((cart, idx) => (
                <article
                  key={cart.id}
                  className="rise group bg-panel/60 border border-cream/10 rounded-2xl p-6 md:p-8 transition-all duration-300 hover:border-cream/25 hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="font-semibold text-lg">{cart.user_email}</p>
                      <p className="text-sm text-muted mt-1">{cart.items.join(" · ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl">₹{cart.cart_value.toLocaleString("en-IN")}</p>
                      <div className="mt-2">
                        <StatusBadge status={cart.status} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {cart.interventions.map((iv, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-cream/10 bg-ink/60 p-5 transition-colors duration-300 group-hover:border-cream/20"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm text-amber">{iv.action.replace(/_/g, " ")}</p>
                          <StatusBadge status={iv.status} />
                        </div>
                        <p className="text-[11px] uppercase tracking-[0.15em] text-muted mb-1">message</p>
                        <p className="text-sm leading-relaxed text-cream/90">{iv.message}</p>
                        <p className="text-[11px] uppercase tracking-[0.15em] text-muted mt-4 mb-1">ai reasoning</p>
                        <p className="text-xs leading-relaxed text-muted">{iv.reasoning}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <button
                      onClick={() => intervene(cart.id)}
                      disabled={busy !== null}
                      className="border border-cream/20 rounded-lg px-4 py-2 text-sm text-cream hover:border-cream/50 hover:bg-cream/5 transition disabled:opacity-50"
                    >
                      {busy === `intervene-${cart.id}` ? "thinking…" : "retry intervention"}
                    </button>
                    {cart.status === "Pending" && (
                      <button
                        onClick={() => recover(cart.id)}
                        disabled={busy !== null}
                        className="border border-sage/30 rounded-lg px-4 py-2 text-sm text-sage hover:bg-sage/10 transition disabled:opacity-50"
                      >
                        {busy === `recover-${cart.id}` ? "processing…" : "simulate user payment"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="flex flex-wrap gap-8 text-sm text-muted pb-10">
          <span>/ bounded</span>
          <span>/ compliant</span>
          <span>/ explainable</span>
          <span className="ml-auto text-cream/40">built for the Razorpay buildathon</span>
        </footer>
      </div>
      {batchStats && (
  <div className="mt-12 bg-panel border border-cream/15 rounded-xl p-8">
    <p className="text-sm text-muted mb-6">/ batch simulation results</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <p className="text-xs text-muted mb-2">/ total value at risk</p>
        <p className="font-display text-4xl text-cream">₹{batchStats.total_value_at_risk.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs text-muted mb-2">/ recovered</p>
        <p className="font-display text-4xl text-amber">₹{batchStats.total_recovered.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-xs text-muted mb-2">/ recovery rate</p>
        <p className="font-display text-4xl text-amber">{batchStats.recovery_rate}%</p>
      </div>
    </div>
    <button
      onClick={() => setBatchStats(null)}
      className="mt-6 text-xs border border-cream/20 rounded-lg px-4 py-2 hover:bg-cream/5 transition"
    >
      clear stats
    </button>
  </div>
)}
    </main>
  );
}
