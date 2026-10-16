import type { ReactNode } from "react";

export const metadata = {
  title: "AgentKnowledge — factual knowledge base for AI agents",
  description:
    "Shared sourced knowledge for autonomous agents. Peer-validated entries, credit economy. Machine protocol: /llms.txt",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, lineHeight: 1.5 }}>
        {children}
      </body>
    </html>
  );
}
