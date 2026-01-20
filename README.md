# Vocabulary Trainer

An offline-capable PWA for learning foreign language vocabulary.

## Features

- **Library Organization**: Manage books, chapters, and sections
- **Add Vocabulary**: Manually or via photo scan (in development)
- **Spaced Repetition**: SM-2 algorithm for optimal learning
- **Practice Modes**: Flashcards, Multiple Choice, Typed Input
- **Parent Quiz Mode**: Parents can verbally quiz their children
- **Offline-capable**: All data is stored locally in the browser
- **Kid-friendly**: Large touch targets, encouraging messages

## Supported Languages

- French
- Spanish
- Latin

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB)
- Zustand (State Management)
- Framer Motion (Animations)

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Create production build
npm run build

# Start production build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── library/           # Library management
│   ├── add/               # Add vocabulary
│   ├── practice/          # Practice mode
│   ├── progress/          # Progress dashboard
│   └── settings/          # Settings
├── components/
│   ├── ui/                # Base components
│   ├── layout/            # Layout components
│   ├── practice/          # Practice components
│   └── progress/          # Progress components
├── lib/
│   ├── db/                # Dexie database
│   ├── learning/          # SM-2 algorithm
│   └── utils/             # Utility functions
└── stores/                # Zustand stores
```

## Usage

1. **Set up library**: Create a book (e.g., "Découvertes 2")
2. **Add chapters**: Add chapters (e.g., "Unité 1")
3. **Create sections**: Create sections for vocabulary groups
4. **Enter vocabulary**: Add words and their translations
5. **Practice**: Select sections and start a practice session
6. **Track progress**: View your learning progress in the dashboard

## License

Private project
