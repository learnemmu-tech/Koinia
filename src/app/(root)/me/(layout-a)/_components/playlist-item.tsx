import Link from "next/link";

import type { MyPlaylist } from "@/types/user-library";

import { ImageCollage } from "@/components/image-collage";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_SONG_COVER } from "@/config/site";

export async function PlaylistItem({ playlist }: { playlist: MyPlaylist }) {
  const { id, name, description } = playlist;

  const imageSrcs = [DEFAULT_SONG_COVER];

  return (
    <Card
      key={id}
      title={name}
      className="group w-32 cursor-pointer border-none bg-transparent shadow-none transition-shadow duration-200 hover:bg-accent hover:shadow-md sm:w-36 sm:border-solid md:w-48 lg:w-56"
    >
      <CardContent className="size-full p-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-md">
          <Link href={`/me/playlist/${id}`} className="absolute inset-0 z-10">
            <span className="sr-only">View {name}</span>
          </Link>

          <ImageCollage src={imageSrcs} />

          <Skeleton className="absolute inset-0 -z-10 size-full hover:scale-110" />
        </div>

        <div className="mt-1 flex w-full flex-col items-center justify-between">
          <h4 className="w-full font-semibold lg:text-lg">
            <Link
              href={`/me/playlist/${id}`}
              className="mx-auto flex max-w-fit items-center"
            >
              <span className="truncate">{name}</span>
            </Link>
          </h4>

          <span className="w-full truncate text-center text-xs capitalize text-secondary-foreground">
            {description}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
