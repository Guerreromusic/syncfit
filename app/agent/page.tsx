"use client";

import { ChatBotIcon } from "@/components/icons";
import { AgentConsole } from "@/components/AgentConsole";

export default function AgentPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="sf-eyebrow">Agent</p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-white">
          <ChatBotIcon className="h-6 w-6 text-lime-400" aria-hidden />
          SyncFit Agent
        </h1>
        <p className="mt-1 text-sm text-soft">
          Talk or type to your AI music-sync partner — ask about SyncFit scores,
          briefs, brand safety, licensing, and which tracks fit. Powered by every
          connected source.
        </p>
      </header>

      <AgentConsole />
    </div>
  );
}
