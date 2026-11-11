import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import { emailConfig } from "@/lib/email/config";

const ACCENT = "#c26a3a";
const INK = "#2a241f";
const MUTED = "#6d625b";
const CREAM = "#f6f1ea";
const CARD = "#fffdfb";

export type EmailBrand = {
  name?: string;
  logoUrl?: string;
  accentColor?: string;
};

type EmailLayoutProps = {
  preview: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  brand?: EmailBrand;
};

function safeAccent(value?: string): string {
  return value && /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : ACCENT;
}

function safeLogo(value?: string): string | null {
  const url = value?.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function EmailLayout({
  preview,
  title,
  eyebrow,
  children,
  brand,
}: EmailLayoutProps) {
  const accent = safeAccent(brand?.accentColor);
  const churchName = brand?.name?.trim();
  const logo = safeLogo(brand?.logoUrl) ?? emailConfig.logoUrl;
  const wordmark = churchName || emailConfig.appName;

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: CREAM,
          fontFamily: "Georgia, 'Times New Roman', serif",
          margin: 0,
          padding: "28px 12px",
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>
          <Section style={{ textAlign: "center", padding: "8px 12px 0" }}>
            <Text
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.22em",
                color: accent,
                margin: "0 0 10px",
                textTransform: "uppercase",
              }}
            >
              {churchName ? churchName : emailConfig.appName}
            </Text>
            <Hr style={{ borderColor: accent, borderTopWidth: "2px", margin: "0 0 4px" }} />
            <Hr style={{ borderColor: accent, borderTopWidth: "1px", margin: "0" }} />
            <Img
              src={logo}
              width="44"
              height="44"
              alt={wordmark}
              title={wordmark}
              style={{
                display: "block",
                margin: "18px auto 8px",
                width: "44px",
                height: "44px",
                border: "0",
                outline: "none",
                textDecoration: "none",
                borderRadius: "8px",
              }}
            />
            <Text
              style={{
                fontSize: "30px",
                lineHeight: "1.2",
                color: INK,
                margin: "0",
                fontWeight: 500,
              }}
            >
              {title}
            </Text>
            {eyebrow ? (
              <Text
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: accent,
                  margin: "10px 0 0",
                }}
              >
                {eyebrow}
              </Text>
            ) : null}
            <Hr style={{ borderColor: "#e4d9cc", margin: "18px 0 0" }} />
          </Section>

          <Section
            style={{
              backgroundColor: CARD,
              padding: "8px 8px 28px",
            }}
          >
            {children}
          </Section>

          <Section
            style={{
              backgroundColor: "#2a241f",
              borderRadius: "0 0 12px 12px",
              padding: "22px 20px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "12px",
                color: "#f6f1ea",
                margin: "0 0 6px",
              }}
            >
              © {new Date().getFullYear()} {emailConfig.appName}. All rights reserved.
            </Text>
            {churchName ? (
              <Text
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "12px",
                  color: "#d9cfc4",
                  margin: "0 0 8px",
                }}
              >
                Sent for {churchName} with {emailConfig.appName}.
              </Text>
            ) : null}
            <Text
              style={{
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: "12px",
                color: "#d9cfc4",
                margin: 0,
              }}
            >
              <Link href={emailConfig.privacyUrl} style={{ color: "#f3d2bf" }}>
                Privacy
              </Link>
              {" · "}
              <Link href={`${emailConfig.appUrl}/settings/notifications`} style={{ color: "#f3d2bf" }}>
                Email preferences
              </Link>
              {" · "}
              <Link href={`mailto:${emailConfig.contactEmail}`} style={{ color: "#f3d2bf" }}>
                {emailConfig.contactEmail}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const emailInk = INK;
export const emailMuted = MUTED;
