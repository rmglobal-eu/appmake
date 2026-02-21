export type ShowcaseSection =
  | "featured"
  | "builders"
  | "community"
  | "personal"
  | "marketing"
  | "business";

export interface ShowcaseProject {
  id: string;
  name: string;
  description: string;
  category: string;
  authorName: string;
  thumbnail: string;
  likes: number;
  section: ShowcaseSection;
}

export const SHOWCASE_PROJECTS: ShowcaseProject[] = [
  // ── Featured (2) ──────────────────────────────────────────────
  {
    id: "showcase-1",
    name: "AI Recipe Generator",
    description:
      "Generate personalized recipes with AI based on ingredients you have at home. Includes nutrition info and step-by-step instructions.",
    category: "AI",
    authorName: "Sarah Chen",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/31aee0242896981.Y3JvcCwyNzk5LDIxOTAsMCww.jpg",
    likes: 342,
    section: "featured",
  },
  {
    id: "showcase-2",
    name: "Startup Landing Kit",
    description:
      "Beautiful, conversion-optimized landing page with waitlist signup, feature sections, pricing table, and testimonials.",
    category: "SaaS",
    authorName: "Marcus Webb",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/ee4150218157641.Y3JvcCw4MDgsNjMyLDAsMA.jpg",
    likes: 287,
    section: "featured",
  },

  // ── Apps for Builders (2) ─────────────────────────────────────
  {
    id: "showcase-3",
    name: "Component Playground",
    description:
      "Live component editor with real-time preview, prop controls, and exportable code snippets.",
    category: "Dev Tools",
    authorName: "Alex Rivera",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/51e6cd110677973.5ff3fe4183cfc.jpg",
    likes: 198,
    section: "builders",
  },
  {
    id: "showcase-4",
    name: "API Mock Server",
    description:
      "Quickly spin up mock REST endpoints with custom responses, delays, and status codes for frontend development.",
    category: "Dev Tools",
    authorName: "Jonas Park",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/87a08b167464553.Y3JvcCwyNDI0LDE4OTYsMCww.png",
    likes: 156,
    section: "builders",
  },

  // ── Community Favorites (6) ───────────────────────────────────
  {
    id: "showcase-5",
    name: "Habit Tracker",
    description: "Track daily habits with streaks, charts, and motivational reminders.",
    category: "Productivity",
    authorName: "Emma Liu",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/242523221824325.Y3JvcCwxMzgwLDEwODAsMCww.png",
    likes: 421,
    section: "community",
  },
  {
    id: "showcase-6",
    name: "Budget Planner",
    description: "Simple monthly budget tracker with category breakdowns and savings goals.",
    category: "Finance",
    authorName: "David Kim",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/377f43188620485.Y3JvcCwxNTM0LDEyMDAsMzQsMC.png",
    likes: 389,
    section: "community",
  },
  {
    id: "showcase-7",
    name: "Pomodoro Timer",
    description: "Beautiful focus timer with task lists, session history, and ambient sounds.",
    category: "Productivity",
    authorName: "Lina Vasquez",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/7af826226359957.Y3JvcCwxMzQyLDEwNTAsMjksMA.png",
    likes: 312,
    section: "community",
  },
  {
    id: "showcase-8",
    name: "Color Palette Studio",
    description: "Generate and explore color palettes with accessibility contrast checking.",
    category: "Design",
    authorName: "Tom Baker",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/51e6cd110677973.5ff3fe4183cfc.jpg",
    likes: 276,
    section: "community",
  },
  {
    id: "showcase-9",
    name: "Markdown Notes",
    description: "Minimalist note-taking app with markdown support and local storage.",
    category: "Productivity",
    authorName: "Nina Patel",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/7a78c1102548679.Y3JvcCwxMDczLDg0MCwwLDA.png",
    likes: 245,
    section: "community",
  },
  {
    id: "showcase-10",
    name: "Weather Dashboard",
    description: "Clean weather app with 7-day forecast, hourly breakdown, and location search.",
    category: "Utility",
    authorName: "Oscar Reyes",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/099fc372036259.Y3JvcCw4MDgsNjMyLDAsMA.png",
    likes: 203,
    section: "community",
  },

  // ── Personal & Entertainment (3) ──────────────────────────────
  {
    id: "showcase-11",
    name: "Movie Watchlist",
    description: "Track movies to watch, rate them, and get AI-powered recommendations.",
    category: "Entertainment",
    authorName: "Mia Johnson",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/1ea298158276259.Y3JvcCwxMzQyLDEwNTAsMjksMA.png",
    likes: 178,
    section: "personal",
  },
  {
    id: "showcase-12",
    name: "Workout Logger",
    description: "Log workouts, track progress with charts, and build custom routines.",
    category: "Health",
    authorName: "Ryan Foster",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/345528227343721.Y3JvcCwyNzk4LDIxODksMCww.jpg",
    likes: 165,
    section: "personal",
  },
  {
    id: "showcase-13",
    name: "Reading Journal",
    description: "Keep track of books read, add notes, and set yearly reading goals.",
    category: "Personal",
    authorName: "Clara Svensson",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/b966b6196758167.Y3JvcCwxMjAwLDkzOCwwLDA.png",
    likes: 143,
    section: "personal",
  },

  // ── Marketing & Content (3) ───────────────────────────────────
  {
    id: "showcase-14",
    name: "Social Media Scheduler",
    description: "Plan and schedule social media posts across platforms with a visual calendar.",
    category: "Marketing",
    authorName: "Jake Morrison",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/f16aff127496499.Y3JvcCwxNjAwLDEyNTEsMCw3NQ.jpg",
    likes: 234,
    section: "marketing",
  },
  {
    id: "showcase-15",
    name: "Email Template Builder",
    description: "Drag-and-drop email template builder with responsive preview and HTML export.",
    category: "Marketing",
    authorName: "Sophie Laurent",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/1b367152163983.Y3JvcCwxMjAyLDk0MSwwLDA.png",
    likes: 189,
    section: "marketing",
  },
  {
    id: "showcase-16",
    name: "Blog CMS",
    description: "Lightweight blog CMS with markdown editor, tags, categories, and SEO tools.",
    category: "Content",
    authorName: "Leo Andersen",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/6864087.546ed667316cb.jpg",
    likes: 167,
    section: "marketing",
  },

  // ── Business (3) ──────────────────────────────────────────────
  {
    id: "showcase-17",
    name: "Invoice Generator",
    description: "Create professional invoices with auto-calculations, PDF export, and client management.",
    category: "Business",
    authorName: "Hannah Wright",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/fd8772183569387.Y3JvcCw4MzY1LDY1NDMsMCww.jpg",
    likes: 256,
    section: "business",
  },
  {
    id: "showcase-18",
    name: "CRM Dashboard",
    description: "Manage customer relationships with pipeline view, contact details, and deal tracking.",
    category: "Business",
    authorName: "Chris Tanaka",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/ee4150218157641.Y3JvcCw4MDgsNjMyLDAsMA.jpg",
    likes: 198,
    section: "business",
  },
  {
    id: "showcase-19",
    name: "Team Task Board",
    description: "Kanban-style task management with drag-and-drop, assignments, and deadline tracking.",
    category: "Business",
    authorName: "Olivia Nguyen",
    thumbnail: "https://mir-s3-cdn-cf.behance.net/projects/max_808/47f996137617549.Y3JvcCw2MTM2LDQ4MDAsMTM2LDA.png",
    likes: 187,
    section: "business",
  },
];

export function getShowcaseBySection(section: ShowcaseSection): ShowcaseProject[] {
  return SHOWCASE_PROJECTS.filter((p) => p.section === section);
}
