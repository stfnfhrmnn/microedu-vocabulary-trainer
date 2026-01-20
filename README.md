# Vokabeltrainer

Eine offline-fähige PWA zum Lernen von Vokabeln für Schüler an deutschen Gymnasien.

## Features

- **Bibliothek-Organisation**: Verwalte Bücher, Kapitel und Abschnitte
- **Vokabeln hinzufügen**: Manuell oder per Foto-Scan (in Entwicklung)
- **Spaced Repetition**: SM-2 Algorithmus für optimales Lernen
- **Übungsmodi**: Karteikarten, Multiple Choice, Eingabe
- **Offline-fähig**: Alle Daten werden lokal im Browser gespeichert
- **Kind-freundlich**: Große Touch-Ziele, ermutigende Nachrichten

## Unterstützte Sprachen

- Französisch
- Spanisch
- Latein

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Dexie.js (IndexedDB)
- Zustand (State Management)
- Framer Motion (Animationen)

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Produktions-Build erstellen
npm run build

# Produktions-Build starten
npm start
```

## Projektstruktur

```
src/
├── app/                    # Next.js App Router Seiten
│   ├── page.tsx           # Startseite
│   ├── library/           # Bibliothek-Verwaltung
│   ├── add/               # Vokabeln hinzufügen
│   ├── practice/          # Übungsmodus
│   ├── progress/          # Fortschritts-Dashboard
│   └── settings/          # Einstellungen
├── components/
│   ├── ui/                # Basis-Komponenten
│   ├── layout/            # Layout-Komponenten
│   ├── practice/          # Übungs-Komponenten
│   └── progress/          # Fortschritts-Komponenten
├── lib/
│   ├── db/                # Dexie Datenbank
│   ├── learning/          # SM-2 Algorithmus
│   └── utils/             # Hilfsfunktionen
└── stores/                # Zustand Stores
```

## Verwendung

1. **Bibliothek einrichten**: Erstelle ein Buch (z.B. "Découvertes 2")
2. **Kapitel hinzufügen**: Füge Kapitel hinzu (z.B. "Unité 1")
3. **Abschnitte erstellen**: Erstelle Abschnitte für Vokabelgruppen
4. **Vokabeln eingeben**: Füge deutsche Wörter und Übersetzungen hinzu
5. **Üben**: Wähle Abschnitte aus und starte eine Übung
6. **Fortschritt verfolgen**: Sieh deinen Lernfortschritt im Dashboard

## Lizenz

Privates Projekt
