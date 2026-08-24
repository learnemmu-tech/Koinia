"use client";

import React from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import type { Favorite } from "@/types/user-library";
import type { Type } from "@/types";

import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { cn, currentlyInDev } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type LikeButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  type: Type;
  name: string;
  token: string;
  favourites?: Favorite;
};

export function LikeButton(props: LikeButtonProps) {
  const { type, token, name, favourites, ...rest } = props;
  const { authUser } = useFirebaseAuth();

  const isFavorite =
    favourites?.songs.includes(token) ||
    favourites?.albums.includes(token) ||
    favourites?.playlists.includes(token) ||
    favourites?.artists.includes(token) ||
    favourites?.podcasts.includes(token);

  const [optimisticLike, setOptimisticLike] = React.useOptimistic(
    isFavorite ?? false,
    (isLiked) => !isLiked
  );

  function likeHandler() {
    if (!authUser) {
      toast.warning("Unable to perform action. Please sign in.", {
        description: "You need to sign in to like this item.",
      });
      return;
    }

    setOptimisticLike(true);
    currentlyInDev();
    void type;
    void token;
  }

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger aria-label="Like" onClick={likeHandler} {...rest}>
        <Heart
          className={cn(
            "size-5 text-inherit transition-transform active:scale-105",
            optimisticLike && "fill-red-500 text-red-500"
          )}
        />
      </TooltipTrigger>

      <TooltipContent>
        {optimisticLike ? "Unlike" : "Like"} `{name}`
      </TooltipContent>
    </Tooltip>
  );
}
