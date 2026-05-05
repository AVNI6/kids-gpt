import {
  Puzzle,
  SpellCheck,
  Calculator,
  FlaskConical,
  Grid3X3,
  Code2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type KidActivity = {
  id: number;
  slug: string;
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: "sky" | "green" | "orange" | "purple" | "pink" | "slate";
  badge?: string;
  xp?: string;
  duration?: string;
  stars?: number;
  users?: string[];
  dark?: boolean;
  steps: string[];
};

export const kidActivities: KidActivity[] = [
  {
    id: 1,
    slug: "flashcards",
    href: "/activities/flashcards",
    title: "Flashcards Master",
    description: "Flip, learn, and remember key facts with super quick review cards.",
    icon: Grid3X3,
    color: "sky",
    duration: "10 Mins",
    steps: [
      "Flip the card to reveal answers",
      "Mark it as mastered or review",
      "Track your progress",
    ],
  },
  {
    id: 2,
    slug: "quizzes",
    href: "/activities/quizzes",
    title: "Quizzes Quest",
    description: "Answer quick questions and level up with every correct choice.",
    icon: Sparkles,
    color: "green",
    xp: "+120 XP",
    steps: ["Pick the best answer", "Collect rewards", "Move to the next challenge"],
  },
  {
    id: 3,
    slug: "logic-puzzles",
    href: "/activities/logic-puzzles",
    title: "Logic Puzzles",
    description: "Test your brain with tricky patterns and sequences. Great for problem solving!",
    icon: Puzzle,
    color: "sky",
    users: ["JD", "AL"],
    steps: ["Solve pattern questions", "Unlock bonus rounds", "Earn streak rewards"],
  },
  {
    id: 4,
    slug: "word-scrambles",
    href: "/activities/word-scrambles",
    title: "Word Scrambles",
    description: "Unscramble letters to find hidden words. Boost your vocabulary while playing!",
    icon: SpellCheck,
    color: "green",
    xp: "+150 XP",
    steps: ["Drag letters into place", "Find bonus words", "Share your best score"],
  },
  {
    id: 5,
    slug: "math-challenges",
    href: "/activities/math-challenges",
    title: "Math Challenges",
    description: "Fast-paced math fun! Solve as many as you can before the timer runs out.",
    icon: Calculator,
    color: "orange",
    duration: "5 Mins",
    steps: ["Pick a speed level", "Solve timed problems", "Beat your best streak"],
  },
  {
    id: 6,
    slug: "science-lab",
    href: "/activities/science-lab",
    title: "Science Lab",
    description: "Mix elements and learn about the world through interactive experiments.",
    icon: FlaskConical,
    color: "purple",
    badge: "New!",
    steps: ["Choose an experiment", "Follow safe lab steps", "Discover new facts"],
  },
  {
    id: 7,
    slug: "memory-match",
    href: "/activities/memory-match",
    title: "Memory Match",
    description: "Find the matching pairs and level up your focus and concentration.",
    icon: Grid3X3,
    color: "pink",
    stars: 2,
    steps: ["Flip cards to match", "Track your time", "Unlock higher levels"],
  },
  {
    id: 8,
    slug: "code-quest",
    href: "/activities/code-quest",
    title: "Code Quest",
    description: "Learn the basics of coding by directing a robot through a maze!",
    icon: Code2,
    color: "slate",
    badge: "Expert",
    steps: ["Arrange commands", "Debug the path", "Finish the quest"],
  },
];

export const activityColorStyles: Record<KidActivity["color"], string> = {
  sky: "border-sky-200 bg-sky-50 text-sky-600",
  green: "border-green-200 bg-green-50 text-green-600",
  orange: "border-orange-200 bg-orange-50 text-orange-600",
  purple: "border-purple-200 bg-purple-50 text-purple-600",
  pink: "border-pink-200 bg-pink-50 text-pink-600",
  slate: "border-slate-200 bg-slate-100 text-slate-700",
};

export const activityButtonStyles: Record<KidActivity["color"], string> = {
  sky: "bg-sky-600 hover:bg-sky-700",
  green: "bg-green-600 hover:bg-green-700",
  orange: "bg-orange-600 hover:bg-orange-700",
  purple: "bg-purple-600 hover:bg-purple-700",
  pink: "bg-pink-600 hover:bg-pink-700",
  slate: "bg-slate-600 hover:bg-slate-700",
};
