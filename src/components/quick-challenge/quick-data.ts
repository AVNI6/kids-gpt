import { BrainTeaserData, FactFusionData, RiddleData, WhoAmIData } from "./types";

export const WHO_AM_I_PRESETS: WhoAmIData[] = [
  {
    clues: [
      "I can be opened and closed.",
      "People often forget what's inside me.",
      "I usually keep food fresh.",
    ],
    options: ["Pantry", "Refrigerator", "Freezer"],
    answer: "Refrigerator",
  },
  {
    clues: [
      "I travel around the world every day.",
      "I rarely carry people.",
      "My destination is usually written on me.",
    ],
    options: ["Parcel", "Ship", "Airplane"],
    answer: "Parcel",
  },
  {
    clues: [
      "I grow throughout my life.",
      "People often cut me.",
      "I can reveal information about your health.",
    ],
    options: ["Hair", "Nails", "Teeth"],
    answer: "Nails",
  },
  {
    clues: [
      "I have a face but no eyes.",
      "People look at me many times a day.",
      "I help measure something nobody can stop.",
    ],
    options: ["Clock", "Watch", "Mirror"],
    answer: "Clock",
  },
  {
    clues: ["I can be cracked.", "I can be told.", "People sometimes keep me for years."],
    options: ["Code", "Password", "Secret"],
    answer: "Secret",
  },
  {
    clues: [
      "I become visible only when conditions are right.",
      "People chase me but can never reach my end.",
      "I contain many colors.",
    ],
    options: ["Aurora", "Rainbow", "Sunset"],
    answer: "Rainbow",
  },
  {
    clues: [
      "I am often found in pairs.",
      "I wear out faster when used heavily.",
      "I leave footprints but never make them.",
    ],
    options: ["Shoes", "Socks", "Gloves"],
    answer: "Shoes",
  },
  {
    clues: [
      "I can be broken without being touched.",
      "People make me to others.",
      "Keeping me builds trust.",
    ],
    options: ["Secret", "Promise", "Contract"],
    answer: "Promise",
  },
];

export const BRAIN_TEASER_PRESETS: BrainTeaserData[] = [
  {
    question:
      "You have three switches outside a closed room. Inside is a single incandescent lightbulb. You can flip the switches however you like, but you can only enter the room once to check the bulb. How do you definitively deduce which switch operates the bulb?",
    hint: "Think about the secondary physical property of an incandescent bulb when left on.",
    options: [
      "Turn one on for 10 minutes, turn it off, turn another on, then enter to check if the bulb is on, off but hot, or off and cold.",
      "Flip all switches rapidly up and down to create a short circuit.",
      "Look underneath the door crack while flipping them one by one.",
    ],
    answer:
      "Turn one on for 10 minutes, turn it off, turn another on, then enter to check if the bulb is on, off but hot, or off and cold.",
  },
  {
    question:
      "You are on a game show. There are 3 doors. Behind one is a car; behind the others, goats. You pick Door 1. The host, who knows what's behind the doors, opens Door 3 to reveal a goat. He asks: 'Do you want to switch to Door 2?' Mathematically, what should you do?",
    hint: "This represents the famous Monty Hall problem where intuition fails probability calculations.",
    options: [
      "Switching gives you a 2/3 probability of winning, while staying keeps it at 1/3.",
      "It doesn't matter; the probability splits evenly to 50/50 for the remaining two doors.",
      "Stay; your initial probability remains the absolute highest.",
    ],
    answer: "Switching gives you a 2/3 probability of winning, while staying keeps it at 1/3.",
  },
  {
    question:
      "You approach a fork in the road guarded by two identical twins. One twin always tells the absolute truth, and the other always lies. One path leads to safety, the other to danger. You can ask exactly ONE question to ONE twin to find the safe path. What do you ask?",
    hint: "You need a question that forces both a liar and a truth-teller to point to the same incorrect door, letting you choose the opposite.",
    options: [
      "'Which path would your twin say is the safe one?' (Then take the opposite path)",
      "'Are you the truth-teller?'",
      "'Which path is the safe one?'",
    ],
    answer: "'Which path would your twin say is the safe one?' (Then take the opposite path)",
  },
  {
    question:
      "Four people need to cross a fragile bridge at night. They have only one flashlight, which must be carried to cross. The bridge can only hold two people at once. Person A takes 1 minute to cross, B takes 2 minutes, C takes 5 minutes, and D takes 10 minutes. When two cross, they move at the slower person's pace. What is the absolute minimum time required for all four to cross?",
    hint: "Send the two slowest people together so their time penalties overlap, rather than having one fast person escort everyone individually.",
    options: ["17 minutes", "19 minutes", "21 minutes"],
    answer: "17 minutes",
  },
  {
    question:
      "If a wooden ship has all of its old wooden planks gradually replaced with new steel components one by one until not a single original piece remains, is it still fundamentally the exact same ship? What classic philosophical paradox is this?",
    hint: "It deals with the identity of an object over time and is named after a legendary Greek hero.",
    options: ["The Ship of Theseus", "The Sorites Paradox", "The Zeno Dichotomy"],
    answer: "The Ship of Theseus",
  },
  {
    question:
      "A crocodile steals a child and promises to return it safely if and only if the father can correctly guess what the crocodile will do. The father guesses: 'You will not return my child.' If the crocodile keeps the child, the father guessed correctly, meaning it must return it. If the crocodile returns it, the guess is false. What type of logical trap is this?",
    hint: "This is an ancient self-referential paradox that breaks binary rule conditions.",
    options: ["The Crocodile Paradox (Dilemma)", "The Bootstrap Paradox", "The Liar's Loop"],
    answer: "The Crocodile Paradox (Dilemma)",
  },
  {
    question:
      "How many people do you need to gather randomly in a single room to reach an exact 50% statistical probability that at least two of them share the exact same birthday (excluding leap years)?",
    hint: "The result is surprisingly low due to the exponential compounding of pairs.",
    options: ["23", "183", "50"],
    answer: "23",
  },
  {
    question:
      "You have 8 identical-looking gold coins, but one is counterfeit and weighs slightly less than the genuine ones. Using a standard mechanical balance scale (two pans), what is the minimum number of total weighings needed to guarantee finding the fake coin?",
    hint: "Divide the coins into groups of three rather than pairs to maximize scale efficiency.",
    options: ["2", "3", "4"],
    answer: "2",
  },
  {
    question:
      "Achilles is running a race against a tortoise. The tortoise gets a 100-meter head start. Whenever Achilles reaches the point where the tortoise was, the tortoise has moved a tiny bit further. Therefore, Achilles must infinitely chase the tortoise and never pass it. What is this famous ancient paradox?",
    hint: "It was devised to argue that motion is an illusion using infinite series convergence concepts.",
    options: [
      "Zeno's Paradox of Achilles and the Tortoise",
      "The Banach-Tarski Paradox",
      "The Arrow Paradox",
    ],
    answer: "Zeno's Paradox of Achilles and the Tortoise",
  },
  {
    question:
      "You are presented with two sealed envelopes. One contains a random amount of money, and the other contains exactly double that amount. You pick one envelope and find $100. You are offered the chance to switch. The expected mathematical value of switching appears to be always advantageous ($200 or $50), yet the choice is symmetrical. What is this paradox called?",
    hint: "It targets probability theory inconsistencies with subjective values.",
    options: ["The Two-Envelope Paradox", "The St. Petersburg Paradox", "The Bertrand Paradox"],
    answer: "The Two-Envelope Paradox",
  },
];

export const FACT_FUSION_PRESETS: FactFusionData[] = [
  {
    clue: "This animal is the fastest land mammal AND cannot roar despite being classified as a big cat.",
    options: ["Cheetah", "Leopard", "Jaguar"],
    answer: "Cheetah",
  },
  {
    clue: "This mammal lays eggs AND has a bill similar to a duck.",
    options: ["Platypus", "Echidna", "Otter"],
    answer: "Platypus",
  },
  {
    clue: "This bird is the largest living bird species AND cannot fly.",
    options: ["Ostrich", "Emu", "Cassowary"],
    answer: "Ostrich",
  },
  {
    clue: "This ocean is the largest on Earth AND contains the Mariana Trench.",
    options: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean"],
    answer: "Pacific Ocean",
  },
  {
    clue: "This planet is known as the Red Planet AND hosts Olympus Mons, the largest volcano in the Solar System.",
    options: ["Mars", "Venus", "Mercury"],
    answer: "Mars",
  },
  {
    clue: "This element is the lightest in the periodic table AND the most abundant element in the universe.",
    options: ["Hydrogen", "Helium", "Lithium"],
    answer: "Hydrogen",
  },
  {
    clue: "This gemstone is made entirely of carbon AND is the hardest naturally occurring substance.",
    options: ["Diamond", "Ruby", "Sapphire"],
    answer: "Diamond",
  },
  {
    clue: "This mountain is Earth's highest above sea level AND lies on the border between Nepal and China.",
    options: ["Mount Everest", "K2", "Kangchenjunga"],
    answer: "Mount Everest",
  },
  {
    clue: "This country contains the Great Pyramids of Giza AND is traversed by the Nile River.",
    options: ["Egypt", "Sudan", "Libya"],
    answer: "Egypt",
  },
  {
    clue: "This rainforest is the largest tropical rainforest in the world AND produces roughly 20% of Earth's oxygen.",
    options: ["Amazon Rainforest", "Congo Rainforest", "Daintree Rainforest"],
    answer: "Amazon Rainforest",
  },
  {
    clue: "This scientist formulated the laws of motion AND universal gravitation.",
    options: ["Isaac Newton", "Galileo Galilei", "Johannes Kepler"],
    answer: "Isaac Newton",
  },
  {
    clue: "This planet is famous for its ring system AND is less dense than water.",
    options: ["Saturn", "Jupiter", "Uranus"],
    answer: "Saturn",
  },
  {
    clue: "This reptile changes color for camouflage AND can move its eyes independently.",
    options: ["Chameleon", "Gecko", "Iguana"],
    answer: "Chameleon",
  },
  {
    clue: "This invention was patented by Alexander Graham Bell AND transformed long-distance communication.",
    options: ["Telephone", "Telegraph", "Radio"],
    answer: "Telephone",
  },
  {
    clue: "This continent is the smallest by land area AND is also a country.",
    options: ["Australia", "Antarctica", "Greenland"],
    answer: "Australia",
  },
];

export const RIDDLE_PRESETS: RiddleData[] = [
  {
    question:
      "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
    hint: "Think of sound waves reflecting in a cave.",
    options: ["An echo", "A cloud", "A shadow"],
    answer: "An echo",
  },
  {
    question: "The more of them you take, the more you leave behind. What are they?",
    hint: "You make them when walking on sand.",
    options: ["Footsteps", "Secrets", "Photos"],
    answer: "Footsteps",
  },
  {
    question:
      "I have keys but no locks. I have space but no room. You can enter but can't go outside. What am I?",
    hint: "You use me to type on a computer!",
    options: ["A keyboard", "A piano", "A diary"],
    answer: "A keyboard",
  },
  {
    question: "What has to be broken before you can use it?",
    hint: "It comes from a chicken.",
    options: ["An egg", "A promise", "A glowstick"],
    answer: "An egg",
  },
  {
    question: "What has hands but cannot clap?",
    hint: "It tells you what time it is.",
    options: ["A clock", "A mirror", "A tree"],
    answer: "A clock",
  },
  {
    question: "What goes up but never comes down?",
    hint: "You have one, and it increases every year.",
    options: ["Your age", "A balloon", "The temperature"],
    answer: "Your age",
  },
  {
    question: "I am full of holes but still hold water. What am I?",
    hint: "You use me in the kitchen or bath to clean.",
    options: ["A sponge", "A bucket", "A net"],
    answer: "A sponge",
  },
  {
    question: "What has a head and a tail but no body?",
    hint: "You flip it to make a decision.",
    options: ["A snake", "A coin", "A kite"],
    answer: "A coin",
  },
  {
    question: "What has a neck but no head?",
    hint: "It wears a cap or holds your favorite drink.",
    options: ["A bottle", "A shirt", "A guitar"],
    answer: "A bottle",
  },
  {
    question: "What is orange, wears a green hat, and sounds like a parrot?",
    hint: "It's a crunchy vegetable rabbits love.",
    options: ["An orange", "A pumpkin", "A carrot"],
    answer: "A carrot",
  },
];
