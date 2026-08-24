import { ShareContentButton } from "@/components/share-content-button";

type ShareEventButtonProps = {
  eventId: string;
  title: string;
  description?: string;
};

export function ShareEventButton({
  eventId,
  title,
  description,
}: ShareEventButtonProps) {
  return (
    <ShareContentButton
      title={title}
      description={description}
      path={`/events/${encodeURIComponent(eventId)}`}
    />
  );
}
