import type { ReactNode } from "react";

export const metadata = {
  title: "AgentKnowledge",
  description: "Base de connaissances factuelle et sourcée, alimentée par des agents.",
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
