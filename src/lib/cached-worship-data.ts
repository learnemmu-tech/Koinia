import { cache } from "react";

import { unstable_cache } from "next/cache";



import type { FirebaseArticle } from "@/types/firebase-article";

import type { FirebaseEvent } from "@/types/firebase-event";

import type { FirebaseSermon } from "@/types/firebase-sermon";

import type { FirebaseSong } from "@/types/firebase-song";



import { getArticleById, getPublishedArticles } from "./firebase-article-queries";

import { getPublishedEvents } from "./firebase-event-queries";

import { getSermonById, getPublishedSermons } from "./firebase-sermon-queries";

import { getPublishedSongs, getSongById } from "./firebase-queries";

import { toArticleListItem } from "./article-firestore";

import {

  recordMatchesTenantScope,

  type TenantScope,

} from "./organization/tenant-scope";

import { toSermonListItem } from "./sermon-firestore";

import { toSongListItem } from "./song-firestore";



const REVALIDATE_SECONDS = 60;



function tenantCacheKey(scope: TenantScope): string {

  return `${scope.organizationId}:${scope.churchId}:${scope.branchId ?? ""}`;

}



export const getPublishedSongsCached = cache(async (scope: TenantScope) => {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async (): Promise<FirebaseSong[]> => {

      const songs = await getPublishedSongs(scope);

      return songs.map(toSongListItem);

    },

    ["worship-published-songs", key],

    {

      revalidate: REVALIDATE_SECONDS,

      tags: ["worship-songs", `tenant-${key}`],

    }

  )();

});



export const getPublishedSermonsCached = cache(async (scope: TenantScope) => {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async (): Promise<FirebaseSermon[]> => {

      const sermons = await getPublishedSermons(scope);

      return sermons.map(toSermonListItem);

    },

    ["worship-published-sermons", key],

    {

      revalidate: REVALIDATE_SECONDS,

      tags: ["worship-sermons", `tenant-${key}`],

    }

  )();

});



export const getPublishedArticlesCached = cache(async (scope: TenantScope) => {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async (): Promise<FirebaseArticle[]> => {

      const articles = await getPublishedArticles(scope);

      return articles.map(toArticleListItem);

    },

    ["worship-published-articles", key],

    {

      revalidate: REVALIDATE_SECONDS,

      tags: ["worship-articles", `tenant-${key}`],

    }

  )();

});



export const getPublishedEventsCached = cache(async (scope: TenantScope) => {

  const key = tenantCacheKey(scope);

  return unstable_cache(

    async (): Promise<FirebaseEvent[]> => {

      return getPublishedEvents(scope);

    },

    ["worship-published-events", key],

    { revalidate: REVALIDATE_SECONDS, tags: ["events", `tenant-${key}`] }

  )();

});



export const getSongByIdCached = cache(

  async (scope: TenantScope, songId: string) => {

    const key = tenantCacheKey(scope);

    return unstable_cache(

      async () => {

        const song = await getSongById(songId);

        if (!recordMatchesTenantScope(song, scope, { allowLegacyBranchless: true, defaultBranchId: scope.branchId ?? null })) {

          return null;

        }

        return song;

      },

      ["worship-song-by-id", key, songId],

      {

        revalidate: REVALIDATE_SECONDS,

        tags: [`worship-song-${songId}`, `tenant-${key}`],

      }

    )();

  }

);



export const getSermonByIdCached = cache(

  async (scope: TenantScope, sermonId: string) => {

    const key = tenantCacheKey(scope);

    return unstable_cache(

      async () => {

        const sermon = await getSermonById(sermonId);

        if (!recordMatchesTenantScope(sermon, scope, { allowLegacyBranchless: true, defaultBranchId: scope.branchId ?? null })) {

          return null;

        }

        return sermon;

      },

      ["worship-sermon-by-id", key, sermonId],

      {

        revalidate: REVALIDATE_SECONDS,

        tags: [`worship-sermon-${sermonId}`, `tenant-${key}`],

      }

    )();

  }

);



export const getArticleByIdCached = cache(

  async (scope: TenantScope, articleId: string) => {

    const key = tenantCacheKey(scope);

    return unstable_cache(

      async () => {

        const article = await getArticleById(articleId);

        if (!recordMatchesTenantScope(article, scope, { allowLegacyBranchless: true, defaultBranchId: scope.branchId ?? null })) {

          return null;

        }

        return article;

      },

      ["worship-article-by-id", key, articleId],

      {

        revalidate: REVALIDATE_SECONDS,

        tags: [`worship-article-${articleId}`, `tenant-${key}`],

      }

    )();

  }

);



export type WorshipCatalog = {

  songs: FirebaseSong[];

  sermons: FirebaseSermon[];

  articles: FirebaseArticle[];

  events: FirebaseEvent[];

};



export const getWorshipCatalogCached = cache(

  async (scope: TenantScope): Promise<WorshipCatalog> => {

    const [songs, sermons, articles, events] = await Promise.all([

      getPublishedSongsCached(scope),

      getPublishedSermonsCached(scope),

      getPublishedArticlesCached(scope),

      getPublishedEventsCached(scope),

    ]);

    return { songs, sermons, articles, events };

  }

);


