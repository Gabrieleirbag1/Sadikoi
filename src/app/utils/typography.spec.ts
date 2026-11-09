import { keepPunctuationAttached } from './typography';

describe('keepPunctuationAttached', () => {
  it('ties the punctuation to the word before it', () => {
    expect(keepPunctuationAttached('qui craque en premier ?')).toBe('qui craque en premier ?');
    expect(keepPunctuationAttached('journée : qui ! oui ; non')).toBe('journée : qui ! oui ; non');
  });

  it('ties the French quotes to the words inside them', () => {
    expect(keepPunctuationAttached('« salut »')).toBe('« salut »');
  });

  it('leaves English questions as they are', () => {
    expect(keepPunctuationAttached('Who would win? Me: no.')).toBe('Who would win? Me: no.');
  });
});
