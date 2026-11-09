import { mentionQuery, mentionSuggestions, splitMentions } from './mentions';

const user = (id: number, username: string) => ({ id, username } as User);
const jean = user(1, 'Jean');
const jeanPaul = user(2, 'Jean Paul');
const zoe = user(3, 'zoé_42');
const members = [jean, jeanPaul, zoe];

describe('splitMentions', () => {
  it('keeps a message without mentions as one piece of text', () => {
    expect(splitMentions('salut tout le monde', members)).toEqual([{ text: 'salut tout le monde' }]);
  });

  it('finds members anywhere, in any case, keeping the text as typed', () => {
    expect(splitMentions('@jean et @ZOÉ_42 !', members)).toEqual([
      { text: '@jean', user: jean },
      { text: ' et ' },
      { text: '@ZOÉ_42', user: zoe },
      { text: ' !' },
    ]);
  });

  it('prefers the longest name (usernames can have spaces)', () => {
    expect(splitMentions('coucou @Jean Paul', members)).toEqual([{ text: 'coucou ' }, { text: '@Jean Paul', user: jeanPaul }]);
    expect(splitMentions('@Jean Pierre', members)).toEqual([{ text: '@Jean', user: jean }, { text: ' Pierre' }]);
  });

  it('ignores unknown names, emails and names glued to a word', () => {
    expect(splitMentions('@Paul', members)).toEqual([{ text: '@Paul' }]);
    expect(splitMentions('mail@jean.fr', members)).toEqual([{ text: 'mail@jean.fr' }]);
    expect(splitMentions('@Jeanne', members)).toEqual([{ text: '@Jeanne' }]);
  });

  it('accepts a mention stuck to punctuation', () => {
    expect(splitMentions('(@Jean)', members)).toEqual([{ text: '(' }, { text: '@Jean', user: jean }, { text: ')' }]);
  });
});

describe('mentionQuery', () => {
  it('returns the name typed right after an "@" that begins a word', () => {
    expect(mentionQuery('salut @je', 9)).toEqual({ start: 6, query: 'je' });
    expect(mentionQuery('@', 1)).toEqual({ start: 0, query: '' });
    expect(mentionQuery('@Jean P', 7)).toEqual({ start: 0, query: 'Jean P' });
  });

  it('looks only before the cursor', () => {
    expect(mentionQuery('@jean salut', 3)).toEqual({ start: 0, query: 'je' });
  });

  it('is null without a fresh "@"', () => {
    expect(mentionQuery('salut', 5)).toBeNull();
    expect(mentionQuery('mail@je', 7)).toBeNull();
    expect(mentionQuery('@jean\nsalut', 11)).toBeNull();
  });
});

describe('mentionSuggestions', () => {
  it('lists the members starting with the typed name, alphabetically, without me', () => {
    expect(mentionSuggestions(members, 'je', 3)).toEqual([jean, jeanPaul]);
    expect(mentionSuggestions(members, '', 1)).toEqual([jeanPaul, zoe]);
    expect(mentionSuggestions(members, 'ZO', 1)).toEqual([zoe]);
    expect(mentionSuggestions(members, 'x', 1)).toEqual([]);
  });
});
