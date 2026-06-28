"use client";

import type { ComponentProps } from "react";
import dynamic from "next/dynamic";

const StatusTab = dynamic(() => import("./tabs/StatusTab").then((module) => module.StatusTab), {
  loading: () => <TabSkeleton />,
});

type StatusTabProps = ComponentProps<typeof StatusTab>;

function TabSkeleton() {
  return <div className="h-80 animate-pulse rounded-[1.5rem] bg-white/70" />;
}

export function WorkspaceTabs({
  statusProps,
  filesProps: _filesProps,
  secretsProps: _secretsProps,
  conversationId: _conversationId,
}: {
  statusProps: StatusTabProps;
  filesProps: unknown;
  secretsProps: unknown;
  conversationId?: string;
}) {
  void _filesProps;
  void _secretsProps;
  void _conversationId;

  return <StatusTab {...statusProps} />;
}
