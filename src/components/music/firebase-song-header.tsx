"use client";



import type { FirebaseSong } from "@/types/firebase-song";



import { ImageWithFallback } from "@/components/image-with-fallback";
import { getSongCoverUrl } from "@/lib/utils";
import { DEFAULT_SONG_COVER } from "@/config/site";

import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";

import { CloudDownload, Loader } from "lucide-react";

import { useState } from "react";

import { toast } from "sonner";



type FirebaseSongHeaderProps = {

  song: FirebaseSong;

};



export function FirebaseSongHeader({ song }: FirebaseSongHeaderProps) {

  const [isDownloading, setIsDownloading] = useState(false);



  const downloadHandler = async () => {

    if (!song.audioUrl) {

      toast.error("Audio file not available for download");

      return;

    }



    setIsDownloading(true);

    try {

      const audioResponse = await fetch(song.audioUrl);

      if (!audioResponse.ok) {

        throw new Error("Failed to fetch audio file");

      }



      const audioBlob = await audioResponse.blob();

      const audioUrl = URL.createObjectURL(audioBlob);

      const audioLink = document.createElement("a");

      audioLink.href = audioUrl;

      audioLink.download = `${song.title}.m4a`;



      function handleAudioDownload() {

        setTimeout(() => {

          URL.revokeObjectURL(audioUrl);

          audioLink.removeEventListener("click", handleAudioDownload);

        }, 150);

      }



      audioLink.addEventListener("click", handleAudioDownload);

      audioLink.click();



      toast.success(`Downloaded ${song.title}`);



      if (song.lyrics) {

        const lyricsBlob = new Blob([song.lyrics], { type: "text/plain" });

        const lyricsUrl = URL.createObjectURL(lyricsBlob);

        const lyricsLink = document.createElement("a");

        lyricsLink.href = lyricsUrl;

        lyricsLink.download = `${song.title}_lyrics.txt`;



        function handleLyricsDownload() {

          setTimeout(() => {

            URL.revokeObjectURL(lyricsUrl);

            lyricsLink.removeEventListener("click", handleLyricsDownload);

          }, 150);

        }



        lyricsLink.addEventListener("click", handleLyricsDownload);

        lyricsLink.click();

        toast.success("Downloaded lyrics");

      }

    } catch (error) {

      console.error("[Download] Failed:", error);

      toast.error("Download failed");

    } finally {

      setIsDownloading(false);

    }

  };



  return (

    <figure className="mb-6 flex flex-col items-center gap-4 sm:gap-6 md:gap-8 lg:flex-row lg:items-start lg:gap-10">

      <div className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-lg border border-secondary p-1 shadow-md sm:w-44 md:w-56 xl:w-64">

        <ImageWithFallback

          src={getSongCoverUrl(song.imageUrl)}

          fallback={DEFAULT_SONG_COVER}

          width={256}

          height={256}

          alt={song.title}

          className="size-full rounded object-cover"

        />

        <Skeleton className="absolute inset-0 -z-10 size-full" />

      </div>



      <figcaption className="flex w-full min-w-0 flex-col space-y-3 text-center lg:text-left lg:space-y-4">

        <h1 className="font-heading text-2xl font-bold drop-shadow-md dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-3xl md:text-4xl lg:text-5xl">

          {song.title}

        </h1>



        {song.audioUrl && (

          <div className="mt-2 flex justify-center lg:justify-start">

            <Button

              onClick={downloadHandler}

              disabled={isDownloading}

              variant="outline"

              size="sm"

              className="gap-2"

            >

              {isDownloading ? (

                <Loader className="size-4 animate-spin" />

              ) : (

                <CloudDownload className="size-4" />

              )}

              {isDownloading ? "Downloading..." : "Download"}

            </Button>

          </div>

        )}

      </figcaption>

    </figure>

  );

}


