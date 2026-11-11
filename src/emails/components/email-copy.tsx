import { Section, Text } from "@react-email/components";
import type { ReactNode } from "react";

import { emailInk, emailMuted } from "@/emails/components/email-layout";

export function EmailText({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "16px",
        lineHeight: "1.65",
        color: emailInk,
        margin: "0 0 14px",
      }}
    >
      {children}
    </Text>
  );
}

export function EmailNote({ children }: { children: ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: "#f3efe8",
        borderRadius: "10px",
        padding: "14px 16px",
        margin: "0 0 16px",
      }}
    >
      <Text
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "15px",
          lineHeight: "1.6",
          color: emailMuted,
          margin: 0,
        }}
      >
        {children}
      </Text>
    </Section>
  );
}

export function EmailFacts({ rows }: { rows: Array<[string, string | undefined]> }) {
  const visible = rows.filter((row): row is [string, string] => Boolean(row[1]?.trim()));
  if (visible.length === 0) return null;
  return (
    <Section style={{ margin: "0 0 16px" }}>
      {visible.map(([label, value]) => (
        <Text
          key={label}
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "14px",
            lineHeight: "1.6",
            color: emailInk,
            margin: "0 0 4px",
          }}
        >
          <span style={{ color: emailMuted }}>{label}</span>
          <br />
          {value}
        </Text>
      ))}
    </Section>
  );
}
