export const DEFAULT_SONG_COVER = "/images/default-cover.png";

export const siteConfig = {
  name: "FaithConnectHub",
  url: "https://faithconnecthub.com/",
  description:
    "FaithConnectHub is a Christian worship and ministry platform for songs, sermons, articles, prayer requests, events, and donations.",
  image: "/images/logo.png",
  icon: "/icon.png",
  appleIcon: "/apple-icon.png",

  ministry: {
    title: "FaithConnectHub",
    author: "Emmanuel",
  },

  profile: {
    name: "Emmanuel",
    image: "/images/profile.png",
  },

  author: {
    name: "FaithConnectHub",
    url: "https://www.youtube.com  ",
    email: "privacy@faithconnecthub.org",
    x: "",
  },

  links: {
    github: "",
    discord: "",
    x: "",
  },
};

export type SiteConfig = typeof siteConfig;
