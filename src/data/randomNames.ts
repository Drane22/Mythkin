// Local names only. No files, contacts, history, or external service feed this pool.
export const GIVEN_NAMES = [
  'Amihan', 'Aisha', 'Alina', 'Amara', 'Anna', 'Arun', 'Aya', 'Bayani',
  'Basil', 'Clara', 'Dalia', 'Diego', 'Elias', 'Emilia', 'Ezekiel', 'Felix',
  'Hana', 'Hiro', 'Idris', 'Ines', 'Isabel', 'Jun', 'Kai', 'Kofi',
  'Leila', 'Leon', 'Ligaya', 'Lucia', 'Luis', 'Maeve', 'Marco', 'Maria',
  'Mateo', 'Maya', 'Mira', 'Nadia', 'Naomi', 'Nico', 'Noor', 'Oscar',
  'Priya', 'Rafael', 'Ravi', 'Rosa', 'Santiago', 'Sigrid', 'Sofia', 'Tala',
  'Tomas', 'Yara', 'Yuki', 'Zainab',
] as const;

/** Shuffle without repeating until the whole pool has been used. */
export function createNameGenerator(random: () => number = Math.random) {
  let bag: string[] = [];
  let previous = '';
  return (prefer?: (name: string) => boolean) => {
    if (!bag.length) {
      bag = [...GIVEN_NAMES];
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      if (bag[bag.length - 1] === previous) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    // Reorder the remaining bag, never discard names to satisfy a preference.
    if(prefer){const index=bag.findIndex(name=>name!==previous&&prefer(name));if(index>=0)[bag[index],bag[bag.length-1]]=[bag[bag.length-1],bag[index]];}
    previous = bag.pop()!;
    return previous;
  };
}
export const generateRandomName = createNameGenerator();
