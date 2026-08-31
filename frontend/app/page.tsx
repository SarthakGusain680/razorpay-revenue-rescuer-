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
      console.error("Batch simulation failed", e);
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
            <span className="font-semibold tracking-tight
