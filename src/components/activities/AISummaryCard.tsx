"use client";

import { useState, useEffect } from "react";
import { ContactAISummary } from "@/services/server/AISummaryService";
import { Button } from "@/components/ui";
import { useDataStore } from "@/hooks/useDataStore";
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw, Plus, Clock, MessageSquare } from "lucide-react";

interface AISummaryCardProps {
  contactId: string;
}

export function AISummaryCard({ contactId }: AISummaryCardProps) {
  const { openQuickCreate } = useDataStore();
  const [summary, setSummary] = useState<ContactAISummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/summary?contactId=${contactId}`);
      if (!res.ok) throw new Error("Failed to load AI summary");
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || "Could not generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (contactId) {
      loadSummary();
    }
  }, [contactId]);

  if (isLoading) {
    return (
      <div className="p-5 rounded-3xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/30 dark:bg-indigo-950/20 animate-pulse space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-200 dark:bg-indigo-800" />
          <div className="h-4 w-40 bg-indigo-200 dark:bg-indigo-800 rounded" />
        </div>
        <div className="h-3 w-full bg-indigo-100 dark:bg-indigo-900 rounded" />
        <div className="h-3 w-3/4 bg-indigo-100 dark:bg-indigo-900 rounded" />
      </div>
    );
  }

  if (error || !summary) {
    return null;
  }

  let healthColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  let healthIcon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
  let healthLabel = "Excellent Cadence";

  if (summary.healthStatus === "needs_attention") {
    healthColor = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
    healthIcon = <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />;
    healthLabel = "Attention Required";
  } else if (summary.healthStatus === "warm") {
    healthColor = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    healthIcon = <Clock className="w-3.5 h-3.5 text-amber-600" />;
    healthLabel = "Active Pipeline";
  } else if (summary.healthStatus === "new_lead") {
    healthColor = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    healthIcon = <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
    healthLabel = "New Opportunity";
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-linear-to-br from-indigo-50/50 via-white to-purple-50/30 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/20 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header with Health Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-indigo-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              AI Relationship Intelligence
            </h3>
            <p className="text-[11px] text-zinc-500">
              Automated briefing analyzed from interaction timeline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${healthColor}`}>
            {healthIcon}
            <span>{healthLabel} · {summary.healthScore}%</span>
          </span>
          <button
            onClick={loadSummary}
            title="Refresh AI briefing"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
        {summary.summary}
      </p>

      {/* Commitments & Talking Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Key Commitments */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            Key Commitments & Priorities
          </h4>
          <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            {summary.commitments.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Conversation Starters */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
            Next Call Talking Points
          </h4>
          <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            {summary.talkingPoints.map((tp, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-purple-500 font-bold">•</span>
                <span>{tp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Suggested Next Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-600 text-white shadow-sm">
        <div className="space-y-0.5">
          <p className="text-[11px] font-medium text-indigo-200">Recommended Next Move:</p>
          <p className="text-xs sm:text-sm font-bold">{summary.suggestedNextStep.action}</p>
          <p className="text-[11px] text-indigo-100">
            Target Time: <span className="font-semibold text-white">{summary.suggestedNextStep.recommendedTimeframe}</span>
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => openQuickCreate("follow_up", contactId)}
          className="bg-white text-indigo-600 hover:bg-indigo-50 border-transparent text-xs font-bold shrink-0 self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Schedule Follow-Up
        </Button>
      </div>
    </div>
  );
}
