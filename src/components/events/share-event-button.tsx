import { ShareContentButton } from "@/components/share-content-button";

type ShareEventButtonProps = {
  eventId: string;
  title: string;
  description?: string;
  className?: string;
  label?: string;
};

export function ShareEventButton({
  eventId,
  title,
  description,
  className,
  label,
}: ShareEventButtonProps) {
  return (
    <ShareContentButton
      title={title}
      description={description}
      path={`/events/${encodeURIComponent(eventId)}`}
      className={className}
      label={label}
    />
  );
}
