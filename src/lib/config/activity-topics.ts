import { type ActivitySlug } from "@/types/activities.type";

export interface TopicPreset {
  emoji: string;
  name: string;
  category?: string;
  difficulty?: "Easy" | "Medium" | "Hard" | "Expert";
}

export interface ActivityUIConfig {
  title: string;
  subtitle: string;
  placeholder: string;
  loadingWording: string[];
  colorTheme: {
    primary: string;
    border: string;
    bg: string;
    text: string;
    glow: string;
  };
}

export const ACTIVITY_TOPICS_PRESETS: Record<ActivitySlug, TopicPreset[]> = {
  "math-challenges": [
    { emoji: "➕", name: "Addition Adventure", category: "Arithmetic", difficulty: "Easy" },
    { emoji: "✖️", name: "Multiplication Galaxy", category: "Arithmetic", difficulty: "Medium" },
    { emoji: "🍰", name: "Fractions Fun", category: "Numbers", difficulty: "Medium" },
    { emoji: "📐", name: "Geometry Shapes", category: "Shapes", difficulty: "Easy" },
    { emoji: "⏰", name: "Time & Clocks", category: "Measurement", difficulty: "Easy" },
    { emoji: "💵", name: "Money Math", category: "Real World", difficulty: "Medium" },
    { emoji: "🧮", name: "Algebra Basics", category: "Advanced", difficulty: "Hard" },
  ],
  "word-scrambles": [
    { emoji: "🦁", name: "Animals", category: "Vocabulary", difficulty: "Easy" },
    { emoji: "🍎", name: "Fruits", category: "Vocabulary", difficulty: "Easy" },
    { emoji: "🦸‍♂️", name: "Superheroes", category: "Pop Culture", difficulty: "Medium" },
    { emoji: "🚀", name: "Space Words", category: "Science", difficulty: "Medium" },
    { emoji: "⛏️", name: "Minecraft Terms", category: "Gaming", difficulty: "Medium" },
    { emoji: "🐙", name: "Ocean Creatures", category: "Nature", difficulty: "Easy" },
  ],
  "science-lab": [
    { emoji: "🌋", name: "Volcano Experiments", category: "Earth Science", difficulty: "Medium" },
    { emoji: "🧲", name: "Magnet Science", category: "Physics", difficulty: "Easy" },
    { emoji: "🪐", name: "Solar System", category: "Astronomy", difficulty: "Easy" },
    { emoji: "💧", name: "Water Cycle", category: "Biology", difficulty: "Easy" },
    { emoji: "⚡", name: "Electricity", category: "Physics", difficulty: "Hard" },
    { emoji: "🦴", name: "Human Body", category: "Anatomy", difficulty: "Medium" },
  ],
  "logic-puzzles": [
    { emoji: "🔍", name: "Pattern Detective", category: "Reasoning", difficulty: "Easy" },
    { emoji: "🌀", name: "Escape Maze", category: "Navigation", difficulty: "Medium" },
    { emoji: "🔢", name: "Sudoku Kids", category: "Numbers", difficulty: "Medium" },
    { emoji: "⛓️", name: "Sequence Master", category: "Patterns", difficulty: "Hard" },
    { emoji: "🗺️", name: "Treasure Clues", category: "Deduction", difficulty: "Medium" },
    { emoji: "🔺", name: "Shape Logic", category: "Geometry", difficulty: "Easy" },
  ],
  "jigsaw-puzzle": [
    { emoji: "🧩", name: "Ocean Mosaic", category: "Nature", difficulty: "Easy" },
    { emoji: "🌆", name: "City Lights", category: "Places", difficulty: "Medium" },
    { emoji: "🚀", name: "Space Explorer", category: "Adventure", difficulty: "Medium" },
    { emoji: "🌌", name: "Cosmic Vortex", category: "Art", difficulty: "Hard" },
    { emoji: "🎨", name: "Dreamscape Portrait", category: "Creative", difficulty: "Easy" },
    { emoji: "✨", name: "Mystery Scene", category: "Fun", difficulty: "Expert" },
  ],
  flashcards: [
    { emoji: "🗺️", name: "Countries", category: "Geography", difficulty: "Easy" },
    { emoji: "🏛️", name: "Capitals", category: "Geography", difficulty: "Medium" },
    { emoji: "🦁", name: "Animals", category: "Nature", difficulty: "Easy" },
    { emoji: "🫁", name: "Human Body", category: "Anatomy", difficulty: "Medium" },
    { emoji: "📜", name: "History Facts", category: "Social Studies", difficulty: "Hard" },
    { emoji: "📖", name: "Vocabulary Builder", category: "Language", difficulty: "Medium" },
  ],
  quizzes: [
    { emoji: "🚀", name: "Space Quiz", category: "Astronomy", difficulty: "Medium" },
    { emoji: "🦖", name: "Dinosaur Quiz", category: "History", difficulty: "Easy" },
    { emoji: "🦈", name: "Ocean Quiz", category: "Nature", difficulty: "Easy" },
    { emoji: "⚽", name: "Sports Quiz", category: "General", difficulty: "Easy" },
    { emoji: "🎬", name: "Movie Trivia", category: "Entertainment", difficulty: "Medium" },
    { emoji: "🧪", name: "Science Trivia", category: "General Science", difficulty: "Hard" },
  ],

  "match-following": [
    { emoji: "🦁", name: "Animal Matching", category: "Biology", difficulty: "Easy" },
    { emoji: "🏁", name: "Flag Matching", category: "Geography", difficulty: "Hard" },
    { emoji: "🔷", name: "Shape Matching", category: "Math", difficulty: "Easy" },
    { emoji: "🪐", name: "Planet Matching", category: "Astronomy", difficulty: "Medium" },
    { emoji: "🤪", name: "Emoji Matching", category: "Fun", difficulty: "Easy" },
    { emoji: "🔢", name: "Number Pairs", category: "Arithmetic", difficulty: "Easy" },
  ],
  "memory-match": [
    { emoji: "🦁", name: "Animal Match", category: "Nature", difficulty: "Easy" },
    { emoji: "🍉", name: "Fruit Match", category: "Food", difficulty: "Easy" },
    { emoji: "🚗", name: "Vehicle Match", category: "Objects", difficulty: "Medium" },
  ],
};

export const ACTIVITY_UI_CONFIGS: Record<ActivitySlug, ActivityUIConfig> = {
  "math-challenges": {
    title: "Create Math Challenge! 🧮",
    subtitle:
      "Select a cool math quest or type your own arithmetic theme to generate custom equations!",
    placeholder: "e.g., Space Division, Pirate Addition 🏴‍☠️",
    loadingWording: [
      "🧮 Calculating intergalactic math formulas...",
      "📐 Drawing geometric layout lines...",
      "⚡ Charging up the numbers supercomputer...",
      "🚀 Preparing blast-off into the Math Galaxy...",
    ],
    colorTheme: {
      primary: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
      border: "border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5",
      bg: "bg-orange-500/10",
      text: "text-orange-600",
      glow: "bg-orange-500/5",
    },
  },
  "word-scrambles": {
    title: "Create Word Scramble! 🔠",
    subtitle:
      "Select a vocabulary category or write your own custom theme to generate a spelling puzzle!",
    placeholder: "e.g., Magic Wizards, Pokemons 🧙‍♂️",
    loadingWording: [
      "🔠 Shuffling and scrambling dictionary words...",
      "📖 Reviewing vocabulary and spelling hints...",
      "🧩 Shaping letters into a word maze...",
      "🦕 Unleashing dynamic vocabulary builders...",
    ],
    colorTheme: {
      primary: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      border: "border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5",
      bg: "bg-green-500/10",
      text: "text-green-600",
      glow: "bg-green-500/5",
    },
  },
  "science-lab": {
    title: "Create Science Lab! 🧪",
    subtitle:
      "Select a scientific field or type your own custom topic to construct dynamic research experiments!",
    placeholder: "e.g., Chemistry Magic, Dinosaur DNA 🦖",
    loadingWording: [
      "🧪 Pouring virtual liquids in bubbling test tubes...",
      "🧲 Aligning magnetic forcefields and electricity...",
      "🪐 Charting astronomical flight paths...",
      "🧪 Creating dynamic lab worksheets...",
    ],
    colorTheme: {
      primary: "bg-purple-600 hover:bg-purple-700 focus:ring-purple-500",
      border: "border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5",
      bg: "bg-purple-500/10",
      text: "text-purple-600",
      glow: "bg-purple-500/5",
    },
  },
  "logic-puzzles": {
    title: "Create Logic Puzzle! 🧩",
    subtitle:
      "Select a logic playground or type your own custom riddle to challenge your brain power!",
    placeholder: "e.g., Treasure Hunt, Secret Codes 🕵️‍♂️",
    loadingWording: [
      "🔍 Aligning pattern grids and symbols...",
      "🌀 Mapping out trick-maze sequences...",
      "🔢 Structuring Sudoku logic matrices...",
      "⛓️ Locking final code-breaker puzzles...",
    ],
    colorTheme: {
      primary: "bg-sky-600 hover:bg-sky-700 focus:ring-sky-500",
      border: "border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/5",
      bg: "bg-sky-500/10",
      text: "text-sky-600",
      glow: "bg-sky-500/5",
    },
  },
  "jigsaw-puzzle": {
    title: "Create Jigsaw Puzzle! 🧩",
    subtitle:
      "Choose a scene or type your own topic to build a beautiful puzzle with smart image slicing.",
    placeholder: "e.g., Space Cat, Neon City, Ocean Sunset 🌅",
    loadingWording: [
      "🧩 Slicing the artwork into playful puzzle pieces...",
      "🎨 Matching the best scene for your adventure...",
      "✨ Preparing a polished puzzle studio layout...",
      "🚀 Calibrating drag-and-drop puzzle behavior...",
    ],
    colorTheme: {
      primary: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
      border: "border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5",
      bg: "bg-orange-500/10",
      text: "text-orange-600",
      glow: "bg-orange-500/5",
    },
  },
  flashcards: {
    title: "Create Flashcards! 📚",
    subtitle:
      "Select a standard deck topic or write your own custom concept to render beautiful learning cards!",
    placeholder: "e.g., Ancient Egypt, Insect Anatomy 🦟",
    loadingWording: [
      "📚 Fact-checking historical study dates...",
      "🫁 Visualizing anatomy diagrams and terms...",
      "🗺️ Loading capital maps and country flags...",
      "✨ Polishing double-sided flashcard decks...",
    ],
    colorTheme: {
      primary: "bg-sky-600 hover:bg-sky-700 focus:ring-sky-500",
      border: "border-sky-500/20 hover:border-sky-500/40 hover:bg-sky-500/5",
      bg: "bg-sky-500/10",
      text: "text-sky-600",
      glow: "bg-sky-500/5",
    },
  },
  quizzes: {
    title: "Create Quiz Quest! 🧠",
    subtitle:
      "Select a custom category or write your own subject to build a personalized multiple-choice quiz!",
    placeholder: "e.g., Marvel Trivia, Minecraft Crafting 🎮",
    loadingWording: [
      "🧠 Formulating super quiz questions...",
      "✨ Generating funny multiple-choice options...",
      "🦖 Writing educational tips and facts...",
      "🚀 Getting ready for knowledge blast-off...",
    ],
    colorTheme: {
      primary: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
      border: "border-green-500/20 hover:border-green-500/40 hover:bg-green-500/5",
      bg: "bg-green-500/10",
      text: "text-green-600",
      glow: "bg-green-500/5",
    },
  },

  "match-following": {
    title: "Create Match Pairs! 🔗",
    subtitle:
      "Select a pairing connection or write your own topic to build related left-and-right bond items!",
    placeholder: "e.g., Hero Weapons, Food Sources 🍕",
    loadingWording: [
      "🔗 Setting up matching emoji lists...",
      "🧩 Binding associated key partners...",
      "📐 Drawing logic connectivity maps...",
      "⚡ Finalizing the pair-matching cards...",
    ],
    colorTheme: {
      primary: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
      border: "border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5",
      bg: "bg-orange-500/10",
      text: "text-orange-600",
      glow: "bg-orange-500/5",
    },
  },
  "memory-match": {
    title: "Create Memory Match! 🎴",
    subtitle: "Generate a custom card matching grid to train your visual focus!",
    placeholder: "e.g., Cute Kittens, Flag Cards 🏴",
    loadingWording: [
      "🎴 Shuffling memory matching cards...",
      "🦁 Setting up playful card animal emojis...",
      "✨ Generating double-sided card grids...",
    ],
    colorTheme: {
      primary: "bg-pink-600 hover:bg-pink-700 focus:ring-pink-500",
      border: "border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/5",
      bg: "bg-pink-500/10",
      text: "text-pink-600",
      glow: "bg-pink-500/5",
    },
  },
};
