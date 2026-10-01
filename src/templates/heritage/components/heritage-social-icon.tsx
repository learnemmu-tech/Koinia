import type { SocialPlatform } from "@/lib/templates/types";

export function HeritageSocialIcon({
  platform,
}: {
  platform: SocialPlatform;
}) {
  const className = "size-4";
  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.4" cy="6.6" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (platform === "facebook") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.5 8.5V6.8c0-.7.5-1 1.1-1h1.4V3h-2.4C12 3 11 4.5 11 6.6v1.9H9v3h2V21h3.5v-9.5h2.4l.4-3z"
        />
      </svg>
    );
  }
  if (platform === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M23 12.2s0-3.2-.4-4.6c-.2-.8-.9-1.5-1.7-1.7C19.3 5.5 12 5.5 12 5.5s-7.3 0-8.9.4c-.8.2-1.5.9-1.7 1.7C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.8.9 1.5 1.7 1.7 1.6.4 8.9.4 8.9.4s7.3 0 8.9-.4c.8-.2 1.5-.9 1.7-1.7.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.3 3.3-6.3 3.3z"
        />
      </svg>
    );
  }
  if (platform === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M14.2 3h2.6c.3 2.2 1.7 3.8 3.9 4.1v2.6c-1.4 0-2.7-.4-3.9-1.2v6.7c0 3.6-2.9 6.3-6.6 6.3S3.6 18.8 3.6 15.2 6.5 8.9 10.2 8.9c.3 0 .6 0 .9.1v2.7c-.3-.1-.6-.1-.9-.1-2.1 0-3.8 1.7-3.8 3.7s1.7 3.7 3.8 3.7 3.8-1.7 3.8-3.7V3z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M14.7 4h2.4l-5.2 6 6.1 8h-4.8l-3.8-5-4.3 5H3l5.6-6.4L2.8 4h4.9l3.4 4.5L14.7 4zm-.8 12.6h1.3L6.2 5.3H4.8l9.1 11.3z"
      />
    </svg>
  );
}
