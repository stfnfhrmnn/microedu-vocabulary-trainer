# Vocabulary Trainer

A kid-friendly, offline-capable PWA for learning foreign language vocabulary — with class competitions and family sharing.

## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Library** | Organize vocabulary in books, chapters, and sections |
| **Practice Modes** | Flashcards, multiple choice, typed answers |
| **Parent Quiz** | Parents verbally quiz children, rate their answers |
| **Spaced Repetition** | SM-2 algorithm schedules optimal review times |
| **Gamification** | XP, levels, streaks, and achievements |
| **Networks** | Compete with classmates, share books with study groups |
| **Offline-First** | Works without internet, syncs when connected |

## Supported Languages

- French
- Spanish
- Latin

---

## Getting Started

### For Students

1. **Create your library**: Add a book (e.g., "Découvertes 2")
2. **Organize**: Add chapters and sections matching your textbook
3. **Enter vocabulary**: Add words manually or scan from photos
4. **Practice daily**: The app tells you which words need review
5. **Track progress**: Watch your XP grow and level up!

### For Parents

- Use **Parent Quiz Mode** to verbally test your child
- Join your child's **network** as a supporter to see their progress
- Approve deletion of high-practice content (protects their work)

### For Teachers

- Create a **class network** and share the invite code
- Share vocabulary books with the whole class
- Monitor the leaderboard (without competing)

---

## Networks & Competition

Networks let students compete with classmates while keeping their learning data private.

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     CLASS NETWORK                           │
│                   "Klasse 5b Französisch"                   │
│                    Code: ABCD-EFGH                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   COMPETITORS (ranked)           SUPPORTERS (not ranked)   │
│   ┌──────────────────┐          ┌──────────────────┐       │
│   │ 🥇 Emma    850 XP│          │ 👨‍🏫 Herr Schmidt  │       │
│   │ 🥈 Luis    720 XP│          │ 👨‍👩‍👧 Müllers       │       │
│   │ 🥉 Sophie  680 XP│          └──────────────────┘       │
│   │ 4. Max    540 XP │                                     │
│   │ 5. Mia    490 XP │          Teachers & parents can     │
│   └──────────────────┘          see progress but don't     │
│                                 appear on the leaderboard  │
│   SHARED BOOKS                                              │
│   ┌──────────────────┐                                     │
│   │ 📚 Découvertes 2 │  ← Anyone can copy to their library │
│   │ 📚 Vocab Extra   │                                     │
│   └──────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
```

### Creating a Network

**Who can create?** Anyone (teachers, parents, or students)

1. Go to **Networks** section
2. Tap **"Create Network"**
3. Enter a name (e.g., "Klasse 5b Französisch")
4. Choose the type:
   - **Class** — For school classes
   - **Study Group** — For informal learning groups
   - **Family** — For family members
5. Select your role (Teacher/Parent)
6. Share the generated invite code (e.g., `ABCD-EFGH`)

The creator automatically becomes the network admin.

### Joining a Network

1. Get the invite code from your teacher/parent
2. Go to **Networks** → **"Join"**
3. Enter the code (case-insensitive, dash optional)
4. Choose your role:
   - **Student** — Competes on leaderboard
   - **Parent** — Sees progress, doesn't compete
   - **Teacher** — Admin access, doesn't compete
5. Optionally set a nickname (for privacy)

### Roles & Permissions

| Action | Student | Parent | Teacher/Admin |
|--------|:-------:|:------:|:-------------:|
| See leaderboard | ✓ | ✓ | ✓ |
| Compete (ranked) | ✓ | — | — |
| Share books | ✓ | ✓ | ✓ |
| Copy shared books | ✓ | ✓ | ✓ |
| Change network settings | — | — | ✓ |
| Remove members | — | — | ✓ |
| Regenerate invite code | — | — | ✓ |

### Privacy by Design

**What's shared on leaderboards:**
- Nickname (not real name)
- XP earned
- Words reviewed (count only)
- Accuracy percentage
- Streak days

**What's NEVER shared:**
- Specific vocabulary items
- Which words you got wrong
- Individual learning progress
- Your personal books/library

### Leaderboard Periods

View rankings for different time periods:
- **Today** — Daily competition
- **This Week** — Weekly standings (resets Monday)
- **This Month** — Monthly competition
- **All Time** — Total accumulated XP

---

## Book Sharing

Share vocabulary books with your network so others can copy them.

### How Sharing Works

```
Original Book (Emma)          Copied Book (Luis)
┌──────────────────┐         ┌──────────────────┐
│ Découvertes 2    │  COPY   │ Découvertes 2    │
│                  │ ──────► │ (Kopie)          │
│ 150 words        │         │ 150 words        │
└──────────────────┘         └──────────────────┘
        │                            │
        │ Emma edits                 │ Luis edits
        ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│ 155 words        │         │ 152 words        │
└──────────────────┘         └──────────────────┘
     Independent — edits don't affect each other
```

**Key points:**
- Copies are **independent** — your edits don't affect others
- You **own** your copy — full control to edit/delete
- The original owner can unshare, but existing copies remain
- Copy count is shown (see how popular a book is!)

### Sharing a Book

1. Go to your **Library**
2. Open a book
3. Tap **Share** → Select a network
4. Others can now copy it from the network's "Shared Books"

### Copying a Shared Book

1. Go to **Networks** → Select network → **Books** tab
2. Browse shared books
3. Tap **Copy** on any book
4. It appears in your library as "Book Name (Kopie)"

---

## Content Protection

The app protects well-practiced content from accidental deletion.

### Protection Levels

| Reviews | Protection |
|---------|------------|
| 0-9 | Delete immediately |
| 10-49 | Confirmation required |
| 50+ | Must type "LÖSCHEN" to confirm |
| Any (child account) | Parent approval required |

### Copied Content

Content from copied books is **read-only** — you cannot edit or delete vocabulary from a book you copied. This prevents accidental loss of shared content.

To modify: Copy the vocabulary to a new book you create.

---

## Safety Features

### Blocking Users

If someone is bothering you:
1. Go to their profile in a network member list
2. Tap **Block**
3. You won't see each other on leaderboards or member lists

**Note:** Children cannot block directly — this prevents misuse. They should tell a teacher/parent.

### Reporting Content

See inappropriate content or behavior?
1. Tap the **Report** button (on books or profiles)
2. Select the reason
3. Network admins will review

---

## Technical Details

### Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Dexie.js** (IndexedDB for offline storage)
- **Zustand** (State management)
- **Framer Motion** (Animations)
- **PostgreSQL** (Server sync via Neon)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your DATABASE_URL and JWT_SECRET

# Run database migrations
npm run db:push

# Start development server
npm run dev

# Production build
npm run build && npm start
```

### Project Structure

```
src/
├── app/                    # Next.js pages & API routes
│   ├── api/               # REST API endpoints
│   │   ├── networks/      # Network management
│   │   ├── shared-books/  # Book sharing
│   │   ├── stats/         # Competition stats
│   │   └── ...
│   ├── library/           # Library management
│   ├── practice/          # Practice modes
│   └── ...
├── components/
│   ├── network/           # Network UI components
│   ├── competition/       # Leaderboard components
│   ├── sharing/           # Book sharing components
│   ├── practice/          # Practice components
│   └── ui/                # Base components
├── hooks/                 # Custom React hooks
├── lib/
│   ├── db/                # Database schemas
│   ├── services/          # Business logic
│   └── utils/             # Utilities
└── stores/                # Zustand state stores
```

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/networks` | Create a network |
| `POST /api/networks/join` | Join via invite code |
| `GET /api/networks/:id/leaderboard` | Get leaderboard |
| `POST /api/shared-books` | Share a book |
| `POST /api/shared-books/:id/copy` | Copy to library |
| `POST /api/stats/submit` | Submit practice stats |
| `POST /api/blocks` | Block a user |
| `POST /api/reports` | Report content |

---

## License

Private project
