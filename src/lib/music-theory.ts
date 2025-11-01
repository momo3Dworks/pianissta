
import progressionsData from '@/data/progressions.json';

export type ChordQuality = 'Major' | 'Minor' | 'Major 7th' | 'Minor 7th' | 'Unknown';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];


export const midiNoteToName = (midiNote: number, useFlat = false): string => {
  const noteNames = useFlat ? NOTE_NAMES_FLAT : NOTE_NAMES;
  return noteNames[midiNote % 12];
};

export const midiNoteToNameWithOctave = (midiNote: number, useFlat = false): string => {
    const noteName = midiNoteToName(midiNote, useFlat);
    const octave = Math.floor(midiNote / 12) - 1;
    return `${noteName}${octave}`;
}


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
    // Aliases for parsing progression data
    '': [0, 4, 7],
    'm': [0, 3, 7],
    '7': [0, 4, 7, 10],
    'maj7': [0, 4, 7, 11],
    'm7': [0, 3, 7, 10],
    'm9': [0, 3, 7, 10, 14],
    '9': [0, 4, 7, 10, 14],
    '13': [0, 4, 7, 10, 21],
};

const CHORD_FORMULA_ALIASES: Record<string, string[]> = {
    'C7': CHORD_FORMULAS['Dom7'], 'F7': CHORD_FORMULAS['Dom7'], 'G7': CHORD_FORMULAS['Dom7'],
    'A7': CHORD_FORMULAS['Dom7'], 'E7': CHORD_FORMULAS['Dom7'],
    'Dm7': CHORD_FORMULAS['Min7'],
    'Cmaj7': CHORD_FORMULAS['Maj7'], 'Abmaj7': CHORD_FORMULAS['Maj7'],
    'Dm9': CHORD_FORMULAS['Min9'],
    'G13': CHORD_FORMULAS['Dom13'],
    'C9': CHORD_FORMULAS['Dom9'],
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

export const getChordTypeNameFromItem = (item: LearnableItem): string => {
    const parts = item.name.split(' ');
    if (parts.length > 1) {
        return parts.slice(1).join(' ');
    }
    return 'Maj'; // Should not happen with new naming
}
export const getModeTypeNameFromItem = (item: LearnableItem): string => {
    return item.name.split(' ').slice(1).join(' ');
}


export const LEARNABLE_ITEMS: LearnableItem[] = [];

// Create a map for easy lookup of note names to midi value
const noteNameToMidi: { [key: string]: number } = {};
for (let i = 0; i < 12; i++) {
    noteNameToMidi[NOTE_NAMES[i].toUpperCase()] = i;
    noteNameToMidi[NOTE_NAMES_FLAT[i].toUpperCase()] = i;
}


const getRootNoteFromChordName = (chordName: string): number => {
    let notePart = chordName.match(/^[A-Ga-g][#b]?/);
    if (!notePart) return 48; // Default to C3
    let noteStr = notePart[0].toUpperCase();
    
    let baseNote = noteNameToMidi[noteStr];
    
    return 48 + (baseNote % 12);
}

const getChordFormulaFromChordName = (chordName: string): number[] => {
    if (CHORD_FORMULA_ALIASES[chordName]) return CHORD_FORMULA_ALIASES[chordName];
    
    let typePart = chordName.replace(/^[A-Ga-g][#b]?/, '').trim();
    if (CHORD_FORMULAS[typePart]) return CHORD_FORMULAS[typePart];
    
    // More robust matching for common names
    if (typePart.toLowerCase() === 'maj7') return CHORD_FORMULAS['Maj7'];
    if (typePart.toLowerCase() === 'm7') return CHORD_FORMULAS['Min7'];
    if (typePart.toLowerCase() === 'm') return CHORD_FORMULAS['Min'];
    
    return CHORD_FORMULAS['Maj'];
}

export const getChordNotes = (chordName: string): number[] => {
    if (!chordName) return [];
    const rootNote = getRootNoteFromChordName(chordName);
    const formula = getChordFormulaFromChordName(chordName);
    return formula.map(interval => rootNote + interval);
}


// C3 (48) to C6 (84)
for (let root = 48; root <= 84; root++) { 
    const rootNameWithOctave = midiNoteToNameWithOctave(root);

    // Simplified chord generation for clarity
    Object.entries(CHORD_FORMULAS)
      .filter(([name]) => !['', 'm', '7', 'maj7', 'm7', 'm9', '9', '13'].includes(name))
      .forEach(([name, formula]) => {
          const notes = formula.map(interval => root + interval);
          if (notes.every(n => n <= 96)) { // Ensure all notes are within C7
            LEARNABLE_ITEMS.push({
                name: `${rootNameWithOctave} ${name}`,
                type: 'Chord',
                rootNote: root,
                notes: notes
            });
          }
    });

    Object.entries(MODE_FORMULAS).forEach(([name, formula]) => {
        const notes = formula.map(interval => root + interval);
        if (notes.every(n => n <= 96)) { // Ensure all notes are within C7
            LEARNABLE_ITEMS.push({
                name: `${rootNameWithOctave} ${name}`,
                type: 'Mode',
                rootNote: root,
                notes: notes
            });
        }
    });
}


export type Progression = {
    name: string;
    degrees: string[];
    chords_C: string[];
    difficulty: string;
    comment: string;
}

export type Genre = {
    name: string;
    description: string;
    progressions: Progression[];
}

export interface LearnableChordProgression extends Progression {
    genre: string;
    notes: number[]; // All unique notes in the entire progression
    rootNote: number; // Root note of the first chord
}

const createProgression = (prog: Progression, genre: string): LearnableChordProgression => {
    const allNotes = prog.chords_C.flatMap(chordName => getChordNotes(chordName));
    const firstChordRoot = getRootNoteFromChordName(prog.chords_C[0]);

    return {
        ...prog,
        genre: genre,
        notes: [...new Set(allNotes)],
        rootNote: firstChordRoot,
    };
};

export const LEARNABLE_CHORD_PROGRESSIONS: LearnableChordProgression[] = Object.entries(
    progressionsData as Record<string, Genre>
).flatMap(([genreKey, genreData]) => 
    genreData.progressions.map(prog => createProgression(prog, genreData.name))
);


export function identifyChord(notes: number[]): { name: string, notes: string[] } {
  if (notes.length < 1) {
    return { name: '', notes: [] };
  }

  const noteNamesStr = notes.map(n => midiNoteToName(n % 12)).filter((v, i, a) => a.indexOf(v) === i);
  const uniqueNotes = [...new Set(notes.map(n => n % 12))].sort((a, b) => a - b);
  
  if (notes.length === 1) {
    return { name: midiNoteToName(notes[0]), notes: [midiNoteToName(notes[0])] };
  }

  for (let i = 0; i < uniqueNotes.length; i++) {
    const root = uniqueNotes[i];
    const intervals = uniqueNotes.map(note => (note - root + 12) % 12).sort((a, b) => a - b);

    // Prioritize longer formulas first for better matching
    const sortedFormulas = Object.entries(CHORD_FORMULAS).sort(([, a], [, b]) => b.length - a.length);

    for (const [chordName, formula] of sortedFormulas) {
      if (
        formula.length === intervals.length &&
        formula.every((val, index) => val === intervals[index])
      ) {
        let finalChordName = chordName;
        // Avoid 'C Maj' -> 'C'
        if (chordName === 'Maj' || chordName === '') finalChordName = '';
        if (chordName === 'Min') finalChordName = 'm';

        return { name: `${midiNoteToName(root)}${finalChordName}`, notes: noteNamesStr };
      }
    }
  }

  return { name: 'Custom', notes: noteNamesStr };
}
