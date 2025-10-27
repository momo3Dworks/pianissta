
export type ChordQuality = 'Major' | 'Minor' | 'Major 7th' | 'Minor 7th' | 'Unknown';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const midiNoteToName = (midiNote: number): string => {
  return NOTE_NAMES[midiNote % 12];
};

const CHORD_FORMULAS: Record<string, number[]> = {
    'Maj': [0, 4, 7],
    'Min': [0, 3, 7],
    'Dim': [0, 3, 6],
    'Aug': [0, 4, 8],
    'Sus2': [0, 2, 7],
    'Sus4': [0, 5, 7],
    'Maj7': [0, 4, 7, 11],
    'Min7': [0, 3, 7, 10],
    'Dom7': [0, 4, 7, 10],
    'Dim7': [0, 3, 6, 9],
    'Half-Dim7': [0, 3, 6, 10],
    'MinMaj7': [0, 3, 7, 11],
    'AugMaj7': [0, 4, 8, 11],
    'Aug7': [0, 4, 8, 10],
    'Maj6': [0, 4, 7, 9],
    'Min6': [0, 3, 7, 9],
    'Dom9': [0, 4, 7, 10, 14],
    'Maj9': [0, 4, 7, 11, 14],
    'Min9': [0, 3, 7, 10, 14],
    'Dom11': [0, 4, 7, 10, 14, 17],
    'Maj11': [0, 4, 7, 11, 14, 17],
    'Min11': [0, 3, 7, 10, 14, 17],
    'Dom13': [0, 4, 7, 10, 14, 17, 21],
    'Maj13': [0, 4, 7, 11, 14, 17, 21],
    'Min13': [0, 3, 7, 10, 14, 17, 21],
    '5': [0, 7], // Power Chord
};

const MODE_FORMULAS: Record<string, number[]> = {
    'Ionian': [0, 2, 4, 5, 7, 9, 11],
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10],
    'Lydian': [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'Aeolian': [0, 2, 3, 5, 7, 8, 10],
    'Locrian': [0, 1, 3, 5, 6, 8, 10],
};

export type LearnableItem = {
    name: string;
    type: 'Chord' | 'Mode';
    rootNote: number;
    notes: number[];
};

export const LEARNABLE_ITEMS: LearnableItem[] = [];

for (let root = 48; root <= 59; root++) { // C3 to B3 as roots
    const rootName = midiNoteToName(root);

    for (const [name, formula] of Object.entries(CHORD_FORMULAS)) {
        LEARNABLE_ITEMS.push({
            name: `${rootName}${name}`,
            type: 'Chord',
            rootNote: root,
            notes: formula.map(interval => root + interval)
        });
    }

    for (const [name, formula] of Object.entries(MODE_FORMULAS)) {
        LEARNABLE_ITEMS.push({
            name: `${rootName} ${name}`,
            type: 'Mode',
            rootNote: root,
            notes: formula.map(interval => root + interval)
        });
    }
}

export function identifyChord(notes: number[]): { name: string, notes: string[] } {
  if (notes.length < 2) {
    if (notes.length === 1) {
      return { name: midiNoteToName(notes[0]), notes: [midiNoteToName(notes[0])] };
    }
    return { name: '', notes: [] };
  }

  const uniqueNotes = [...new Set(notes.map(n => n % 12))].sort((a, b) => a - b);
  const noteNamesStr = notes.map(midiNoteToName);

  for (let i = 0; i < uniqueNotes.length; i++) {
    const root = uniqueNotes[i];
    const intervals = uniqueNotes.map(note => (note - root + 12) % 12).sort((a, b) => a - b);

    // Prioritize modes if more notes are present
    if (intervals.length >= 7) {
        for (const [modeName, formula] of Object.entries(MODE_FORMULAS)) {
            if (formula.length === intervals.length && formula.every((val, index) => val === intervals[index])) {
                return { name: `${midiNoteToName(root)} ${modeName}`, notes: noteNamesStr };
            }
        }
    }
    
    // Check for chords
    for (const [chordName, formula] of Object.entries(CHORD_FORMULAS)) {
      if (
        formula.length === intervals.length &&
        formula.every((interval, index) => interval === intervals[index])
      ) {
        return { name: `${midiNoteToName(root)}${chordName}`, notes: noteNamesStr };
      }
    }
  }

  return { name: 'Custom', notes: noteNamesStr };
}
