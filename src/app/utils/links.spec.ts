import { splitLinks } from './links';

const jean = { id: 1, username: 'Jean' } as User;

describe('splitLinks', () => {
  it('keeps text without links as it is', () => {
    expect(splitLinks([{ text: 'salut tout le monde' }])).toEqual([{ text: 'salut tout le monde' }]);
  });

  it('finds http and https links anywhere in the text', () => {
    expect(splitLinks([{ text: 'regarde http://a.fr/x?y=1 et https://b.com' }])).toEqual([
      { text: 'regarde ' },
      { text: 'http://a.fr/x?y=1', url: 'http://a.fr/x?y=1' },
      { text: ' et ' },
      { text: 'https://b.com', url: 'https://b.com' },
    ]);
  });

  it('opens "www." links in https', () => {
    expect(splitLinks([{ text: 'www.sadikoi.fr' }])).toEqual([{ text: 'www.sadikoi.fr', url: 'https://www.sadikoi.fr' }]);
  });

  it('leaves the punctuation that ends the sentence out of the link', () => {
    expect(splitLinks([{ text: 'va sur https://a.fr.' }])).toEqual([
      { text: 'va sur ' },
      { text: 'https://a.fr', url: 'https://a.fr' },
      { text: '.' },
    ]);
    expect(splitLinks([{ text: '(https://a.fr)' }])).toEqual([
      { text: '(' },
      { text: 'https://a.fr', url: 'https://a.fr' },
      { text: ')' },
    ]);
  });

  it('keeps a closing parenthesis that belongs to the link', () => {
    const wiki = 'https://fr.wikipedia.org/wiki/Paris_(ville)';
    expect(splitLinks([{ text: `${wiki}.` }])).toEqual([{ text: wiki, url: wiki }, { text: '.' }]);
  });

  it('ignores other schemes and empty links', () => {
    expect(splitLinks([{ text: 'javascript:alert(1)' }])).toEqual([{ text: 'javascript:alert(1)' }]);
    expect(splitLinks([{ text: 'https://.' }])).toEqual([{ text: 'https://.' }]);
  });

  it('leaves mentions untouched', () => {
    expect(splitLinks([{ text: '@Jean', user: jean }, { text: ' https://a.fr' }])).toEqual([
      { text: '@Jean', user: jean },
      { text: ' ' },
      { text: 'https://a.fr', url: 'https://a.fr' },
    ]);
  });
});
