import { Button } from "@react-email/components";

type EmailButtonProps = {
  href: string;
  label: string;
  accentColor?: string;
};

export function EmailButton({ href, label, accentColor }: EmailButtonProps) {
  const background =
    accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : "#c26a3a";
  return (
    <Button
      href={href}
      style={{
        backgroundColor: background,
        borderRadius: "8px",
        color: "#fffdfb",
        display: "inline-block",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "15px",
        fontWeight: 700,
        lineHeight: "1",
        padding: "14px 22px",
        textDecoration: "none",
        textAlign: "center",
      }}
    >
      {label}
    </Button>
  );
}
