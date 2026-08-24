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

type EmailLayoutProps = {
  preview: string;
  title: string;
  children: ReactNode;
};

export function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`
          :root { color-scheme: light dark; }
          body { margin: 0; padding: 0; }
          @media (prefers-color-scheme: dark) {
            .email-body, .email-wrapper { background-color: #111111 !important; }
            .email-card { background-color: #1a1a1a !important; border-color: #2e2e2e !important; }
            .email-title, .email-text { color: #f5f5f5 !important; }
            .email-muted { color: #a3a3a3 !important; }
            .email-footer { color: #737373 !important; }
          }
        `}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        className="email-body"
        style={{
          backgroundColor: "#f4f0f8",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          margin: 0,
          padding: "24px 12px",
        }}
      >
        <Container
          className="email-wrapper"
          style={{ maxWidth: "560px", margin: "0 auto" }}
        >
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Img
              src={emailConfig.logoUrl}
              width="48"
              height="48"
              alt={emailConfig.appName}
              style={{ margin: "0 auto", borderRadius: "12px" }}
            />
            <Text
              className="email-title"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#3d2d52",
                margin: "12px 0 0",
              }}
            >
              {emailConfig.appName}
            </Text>
          </Section>

          <Section
            className="email-card"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e8dff0",
              borderRadius: "16px",
              padding: "32px 28px",
            }}
          >
            <Text
              className="email-title"
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#2d2438",
                margin: "0 0 16px",
                lineHeight: "1.3",
              }}
            >
              {title}
            </Text>
            {children}
          </Section>

          <Hr style={{ borderColor: "#e8dff0", margin: "24px 0" }} />

          <Section style={{ textAlign: "center" }}>
            <Text
              className="email-footer"
              style={{ fontSize: "12px", color: "#6b5f75", margin: "0 0 8px" }}
            >
              © {new Date().getFullYear()} {emailConfig.appName}. All rights
              reserved.
            </Text>
            <Text
              className="email-footer"
              style={{ fontSize: "12px", color: "#6b5f75", margin: "0 0 8px" }}
            >
              <Link
                href={emailConfig.privacyUrl}
                style={{ color: "#7c5c9a", textDecoration: "underline" }}
              >
                Privacy Policy
              </Link>
              {" · "}
              <Link
                href={`mailto:${emailConfig.contactEmail}`}
                style={{ color: "#7c5c9a", textDecoration: "underline" }}
              >
                {emailConfig.contactEmail}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
