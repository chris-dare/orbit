import { Conversation, Model } from "./types";

export const conversations: Conversation[] = [
  {
    id: "c1",
    title: "Renaming a photo library",
    timestamp: "9:41 AM",
    group: "Today",
    messages: [
      {
        id: "m1",
        role: "user",
        content: "What's a clean way to batch-rename photos by their capture date?",
      },
      {
        id: "m2",
        role: "assistant",
        content:
          "Read each file's EXIF DateTimeOriginal, then rename to a sortable format like 2026-08-03_0001.jpg. Keep a mapping table until you've verified the results, so nothing is lost if two photos share a timestamp.",
        status: "done",
      },
    ],
  },
  {
    id: "c1b",
    title: "Debugging a flaky CI job",
    timestamp: "7:12 AM",
    group: "Today",
    messages: [
      { id: "m1b1", role: "user", content: "Our CI fails intermittently on the same test, any ideas?" },
      {
        id: "m1b2",
        role: "assistant",
        content:
          "Most likely a race condition or shared state between test runs — check for global mutable fixtures or timing-dependent assertions first.",
        status: "done",
      },
    ],
  },
  {
    id: "c2",
    title: "Trip to Kyoto — packing list",
    timestamp: "Yesterday",
    group: "Yesterday",
    messages: [
      { id: "m3", role: "user", content: "Packing for Kyoto in November, what should I bring?" },
      {
        id: "m4",
        role: "assistant",
        content:
          "Layered clothing for 8–17°C, a light rain shell, comfortable walking shoes for temple grounds, and a portable battery — you'll be shooting a lot of photos of the maple leaves.",
        status: "done",
      },
    ],
  },
  {
    id: "c3",
    title: "Explaining Swift optionals",
    timestamp: "Monday",
    group: "Previous 7 Days",
    messages: [
      { id: "m5", role: "user", content: "Why does Swift force me to unwrap optionals?" },
      {
        id: "m6",
        role: "assistant",
        content:
          "It moves a whole class of null-pointer crashes from runtime to compile time — the compiler makes you handle the \"no value\" case explicitly, rather than trusting you'll remember to check.",
        status: "done",
      },
    ],
  },
  {
    id: "c4",
    title: "Sourdough starter troubleshooting",
    timestamp: "Saturday",
    group: "Previous 7 Days",
    messages: [
      { id: "m7", role: "user", content: "My starter isn't rising, what am I doing wrong?" },
      {
        id: "m8",
        role: "assistant",
        content:
          "Likely too cold or underfed — try feeding it 1:1:1 twice a day and keeping it around 24–27°C until you see consistent doubling.",
        status: "done",
      },
    ],
  },
];

export const activeConversation: Conversation = {
  id: "active",
  title: "New conversation",
  timestamp: "Now",
  group: "Today",
  messages: [
    {
      id: "a1",
      role: "user",
      content: "Give me a one-sentence pitch for a conversational UI inspired by Apple's design language.",
    },
    {
      id: "a2",
      role: "assistant",
      content:
        "An interface that gets out of the way — quiet materials, restrained motion, and type that carries the whole conversation without shouting for attention.",
      status: "done",
    },
  ],
};

export const models: Model[] = [
  { id: "instant", name: "Instant", description: "Quick answers for everyday questions" },
  { id: "pro", name: "Pro", description: "Balanced speed and depth" },
  { id: "reasoning", name: "Reasoning", description: "Thinks longer on hard problems" },
];
