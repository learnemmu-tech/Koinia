import { Button } from "@react-email/components";

type EmailButtonProps = {
  href: string;
  label: string;
};

export function EmailButton({ href, label }: EmailButtonProps) {
  return (
    <Button
      href={href}
      style={{
        backgroundColor: "#7c5c9a",
        borderRadius: "10px",
        color: "#ffffff",
        display: "inline-block",
        fontSize: "14px",
        fontWeight: 600,
        lineHeight: "1",
        padding: "14px 24px",
        textDecoration: "none",
        marginTop: "8px",
      }}
    >
      {label}
    </Button>
  );
}
