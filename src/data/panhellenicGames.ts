export interface PanhellenicFestival {
  name: string;
  location: string;
  cycle: 'Panhellenic' | 'Local / Regional';
  season: string;
  deity: string;
  crownPrize: string;
  notes: string;
}

export interface GamesDialQuadrant {
  yearInCycle: 1 | 2 | 3 | 4;
  labelGreek: string; // LA, LB, LC, LD (L = Year symbol, A, B, Γ, Δ)
  festivals: PanhellenicFestival[];
}

export const GAMES_DIAL_QUADRANTS: Record<number, GamesDialQuadrant> = {
  1: {
    yearInCycle: 1,
    labelGreek: 'L A (Year 1)',
    festivals: [
      {
        name: 'Isthmia (Ἴσθμια)',
        location: 'Isthmus of Corinth',
        cycle: 'Panhellenic',
        season: 'Spring (April/May)',
        deity: 'Poseidon',
        crownPrize: 'Pine / Dry Celery wreath',
        notes: 'Held biennially in Years 1 and 3 of the Olympiad cycle'
      },
      {
        name: 'Olympia (Ὀλύμπια)',
        location: 'Sanctuary of Zeus, Olympia',
        cycle: 'Panhellenic',
        season: 'Late Summer (July/August, after 2nd/3rd full moon following summer solstice)',
        deity: 'Zeus Olympios',
        crownPrize: 'Olive wreath (Kotinos)',
        notes: 'The supreme athletic festival of the Greek world, founded traditionally in 776 BCE'
      }
    ]
  },
  2: {
    yearInCycle: 2,
    labelGreek: 'L B (Year 2)',
    festivals: [
      {
        name: 'Nemea (Νέμεα)',
        location: 'Valley of Nemea, Argolis',
        cycle: 'Panhellenic',
        season: 'Summer (July)',
        deity: 'Zeus Nemeios',
        crownPrize: 'Wild celery wreath',
        notes: 'Held biennially in Years 2 and 4 of the Olympiad cycle'
      },
      {
        name: 'Naa (Νᾶα)',
        location: 'Dodona, Epirus',
        cycle: 'Local / Regional',
        season: 'Late Summer',
        deity: 'Zeus Naios & Dione',
        crownPrize: 'Oak wreath',
        notes: 'Crucial inscription reading by Jones/Freeth establishing cultural link to northwestern Greece (Epirus/Corinthian colonies)'
      }
    ]
  },
  3: {
    yearInCycle: 3,
    labelGreek: 'L Γ (Year 3)',
    festivals: [
      {
        name: 'Isthmia (Ἴσθμια)',
        location: 'Isthmus of Corinth',
        cycle: 'Panhellenic',
        season: 'Spring (April/May)',
        deity: 'Poseidon',
        crownPrize: 'Pine wreath',
        notes: 'Second biennial celebration of the Isthmian games within the Olympiad'
      },
      {
        name: 'Pythia (Πύθια)',
        location: 'Delphi, Mount Parnassus',
        cycle: 'Panhellenic',
        season: 'Late Summer (August)',
        deity: 'Apollo Pythios',
        crownPrize: 'Laurel wreath',
        notes: 'Second in prestige only to Olympia; featured major musical and theatrical competitions'
      }
    ]
  },
  4: {
    yearInCycle: 4,
    labelGreek: 'L Δ (Year 4)',
    festivals: [
      {
        name: 'Nemea (Νέμεα)',
        location: 'Valley of Nemea, Argolis',
        cycle: 'Panhellenic',
        season: 'Summer (July)',
        deity: 'Zeus Nemeios',
        crownPrize: 'Wild celery wreath',
        notes: 'Second biennial celebration of the Nemean games within the Olympiad'
      },
      {
        name: 'Halieia (Ἁλίεια)',
        location: 'Rhodes',
        cycle: 'Local / Regional',
        season: 'Late Summer (month of Panamos)',
        deity: 'Helios (Sun God)',
        crownPrize: 'Poplar wreath',
        notes: 'Rhodean games honoring Helios; strongly links the mechanism\'s fabrication or calibration to the astronomical workshops of Rhodes (Hipparchus / Posidonius)'
      }
    ]
  }
};

export interface OlympiadStatus {
  olympiadNumber: number;
  yearInOlympiad: 1 | 2 | 3 | 4;
  quadrant: GamesDialQuadrant;
  gamesThisYear: PanhellenicFestival[];
  dialAngleDeg: number; // Anticlockwise angle from top
  historicalEra: string;
}

export function computeOlympiad(astronomicalYear: number): OlympiadStatus {
  // Epoch of 1st Olympiad: 776 BCE (astronomical year -775)
  const diffYears = astronomicalYear - (-775);
  let olympiadNumber: number;
  let yearInOlympiad: 1 | 2 | 3 | 4;

  if (diffYears >= 0) {
    olympiadNumber = Math.floor(diffYears / 4) + 1;
    yearInOlympiad = ((diffYears % 4) + 1) as 1 | 2 | 3 | 4;
  } else {
    // Proleptic negative Olympiads before 776 BCE
    olympiadNumber = Math.floor(diffYears / 4) + 1;
    const rem = ((diffYears % 4) + 4) % 4;
    yearInOlympiad = (rem + 1) as 1 | 2 | 3 | 4;
  }

  const quadrant = GAMES_DIAL_QUADRANTS[yearInOlympiad];
  
  // Games dial moves anticlockwise: 0° is Year 1 top, 90° is Year 2 (left/counter-clockwise), etc.
  const dialAngleDeg = (yearInOlympiad - 1) * 90;

  let era = 'Hellenistic Era';
  if (astronomicalYear < -776) era = 'Pre-Olympic Archaic Greece';
  else if (astronomicalYear <= -480) era = 'Archaic Period';
  else if (astronomicalYear <= -323) era = 'Classical Greece';
  else if (astronomicalYear <= -31) era = 'Hellenistic Greece (Antikythera Mechanism Era)';
  else if (astronomicalYear <= 393) era = 'Roman Imperial Greece (Ended 393 CE by Theodosius I)';
  else if (astronomicalYear < 1896) era = 'Middle Era (Ancient Games Discontinued)';
  else era = 'Modern Olympic Era (Revived Athens 1896)';

  return {
    olympiadNumber,
    yearInOlympiad,
    quadrant,
    gamesThisYear: quadrant.festivals,
    dialAngleDeg,
    historicalEra: era
  };
}
