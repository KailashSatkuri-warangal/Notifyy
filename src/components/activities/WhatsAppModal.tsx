"use client";

import { useState, useEffect } from "react";
import { Modal, Button } from "@/components/ui";
import { Contact, UnifiedActivity } from "@/types";
import { WHATSAPP_TEMPLATES, WhatsAppService } from "@/services/WhatsAppService";
import { useDataStore } from "@/hooks/useDataStore";
import { useToast } from "@/components/ui/Toast";
import { MessageSquare, Send, Copy, Sparkles, Check } from "lucide-react";

interface WhatsAppModalProps {
  contact: Contact | null;
  activity?: UnifiedActivity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function WhatsAppModal({ contact, activity, isOpen, onClose }: WhatsAppModalProps) {
  const { user, refreshData } = useDataStore();
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("meeting_confirmation");
  const [messageText, setMessageText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!contact) return;

    const template = WHATSAPP_TEMPLATES.find((t) => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
    const generated = template.generateText({
      contactName: contact.name,
      company: contact.company,
      userName: user?.name,
      title: activity?.title,
      date: activity?.date,
      time: activity?.time,
      notes: activity?.notes,
    });
    setMessageText(generated);
  }, [contact, activity, selectedTemplateId, user]);

  if (!contact) return null;

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    toast("Message copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    // 1. Open WhatsApp
    WhatsAppService.openWhatsApp(contact.mobile, messageText);

    // 2. Log interaction note automatically in database
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          activityType: "call",
          note: `WhatsApp message sent: "${messageText.substring(0, 80)}..."`,
        }),
      });
      await refreshData();
    } catch {
      // ignore
    }

    toast("Opening WhatsApp...", "success");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send WhatsApp Message"
      description={`To ${contact.name} (${contact.mobile})`}
      maxWidth="lg"
    >
      <div className="space-y-4 pt-2">
        {/* Quick Template Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Quick Business Templates
          </label>
          <div className="flex flex-wrap gap-1.5">
            {WHATSAPP_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tmpl.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedTemplateId === tmpl.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Message Content (Editable)
            </label>
            <span className="text-[11px] text-zinc-400">{messageText.length} characters</span>
          </div>
          <textarea
            rows={5}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 p-3.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:outline-none"
            placeholder="Type your WhatsApp message..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="w-full sm:w-auto text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? "Copied!" : "Copy Text"}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto text-xs"
            >
              Cancel
            </Button>
            <button
              type="button"
              onClick={handleSend}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
