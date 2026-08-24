"use client";

import React from "react";
import { CloudDownload, Loader } from "lucide-react";
import { toast } from "sonner";

import type { Episode, Song } from "@/types";
import type { Lyrics } from "@/types";

import { useDownloadQuality } from "@/hooks/use-store";
import { QUALITIES_MAP } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type DownloadButtonProps = React.HtmlHTMLAttributes<HTMLButtonElement> & {
  songs: (Song | Episode)[];
  lyrics?: Lyrics | null;
};

export function DownloadButton({ songs, lyrics, ...rest }: DownloadButtonProps) {
  const [downloadQuality] = useDownloadQuality();
  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadQualityIndex = QUALITIES_MAP.findIndex(
    ({ quality }) => quality === downloadQuality
  );

  const downloadHandler = async () => {
    setIsDownloading(true);
    try {
      await Promise.all(
        songs.map(async ({ name, download_url }) => {
          let response;

          if (typeof download_url === "string") {
            response = await fetch(download_url);
          } else {
            response = await fetch(download_url.at(downloadQualityIndex)!.link);
          }

          if (!response.body) return;

          const reader = response.body.getReader();

          const chunks: Uint8Array[] = [];

          const contentLength = parseInt(
            response.headers.get("content-length") ?? "0",
            10
          );

          let receivedLength = 0;

          // eslint-disable-next-line no-constant-condition
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value!);
            receivedLength += value!.length;

            const progress = Math.floor((receivedLength / contentLength) * 100);

            if (progress === 100) {
              toast.success(`Downloaded ${name}`);
            }
          }

          const blob = new Blob(chunks);

          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = name + ".m4a";

          function handleDownload() {
            setTimeout(() => {
              URL.revokeObjectURL(url);
              a.removeEventListener("click", handleDownload, false);
            }, 150);
          }

          a.addEventListener("click", handleDownload, false);

          a.click();
        })
      );

      // Download lyrics if available
      if (lyrics && songs.length > 0) {
        const lyricsContent = lyrics.lyrics + "\n\n" + lyrics.lyrics_copyright;
        const lyricsBlob = new Blob([lyricsContent], { type: "text/plain" });
        const lyricsUrl = URL.createObjectURL(lyricsBlob);

        const lyricsLink = document.createElement("a");
        lyricsLink.href = lyricsUrl;
        lyricsLink.download = songs[0].name + "_lyrics.txt";

        function handleLyricsDownload() {
          setTimeout(() => {
            URL.revokeObjectURL(lyricsUrl);
            lyricsLink.removeEventListener("click", handleLyricsDownload, false);
          }, 150);
        }

        lyricsLink.addEventListener("click", handleLyricsDownload, false);
        lyricsLink.click();

        toast.success("Downloaded lyrics");
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger
        aria-label={`Download ${songs.length} songs`}
        onClick={downloadHandler}
        {...rest}
        disabled={isDownloading}
      >
        {isDownloading ?
          <Loader className="size-5 animate-spin" />
        : <CloudDownload className="size-5" />}
      </TooltipTrigger>

      <TooltipContent>
        {songs.length === 1 ?
          `Download \`${songs[0].name}\``
        : `Download ${songs.length} songs`}
      </TooltipContent>
    </Tooltip>
  );
}
