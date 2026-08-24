export type WorshipVerse = {
  reference: string;
  text: string;
};

export const WORSHIP_VERSES: WorshipVerse[] = [
  {
    reference: "Psalm 104:33",
    text: "I will sing unto the Lord as long as I live: I will sing praise to my God while I have my being.",
  },
  {
    reference: "Psalm 95:1",
    text: "O come, let us sing unto the Lord: let us make a joyful noise to the rock of our salvation.",
  },
  {
    reference: "Psalm 100:2",
    text: "Serve the Lord with gladness: come before his presence with singing.",
  },
  {
    reference: "Ephesians 5:19",
    text: "Speaking to yourselves in psalms and hymns and spiritual songs, singing and making melody in your heart to the Lord.",
  },
  {
    reference: "Colossians 3:16",
    text: "Singing with grace in your hearts to the Lord.",
  },
  {
    reference: "Psalm 96:1",
    text: "O sing unto the Lord a new song: sing unto the Lord, all the earth.",
  },
  {
    reference: "Psalm 98:4",
    text: "Make a joyful noise unto the Lord, all the earth: make a loud noise, and rejoice, and sing praise.",
  },
];

export function getVerseOfTheDay(date = new Date()): WorshipVerse {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
  return WORSHIP_VERSES[dayOfYear % WORSHIP_VERSES.length]!;
}
