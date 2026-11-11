'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AgentBuilder } from '@/components/agents/agent-builder';

function BuilderWithTemplate() {
  const params = useSearchParams();
  const template = params.get('template');
  const agentId = params.get('agent');
  return (
    <AgentBuilder
      key={agentId ?? template ?? 'blank'}
      template={template}
      agentId={agentId}
    />
  );
}

export default function NewAgentPage() {
  return (
    <Suspense fallback={null}>
      <BuilderWithTemplate />
    </Suspense>
  );
}
