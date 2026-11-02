import { backAction } from './back-button';

describe('backAction', () => {
  it('goes home from a group, whatever came before', () => {
    expect(backAction('/group/12', true)).toBe('home');
    expect(backAction('/group/12', false)).toBe('home');
    expect(backAction('/group/12?day=3', true)).toBe('home');
  });

  it('puts the app in the background from home', () => {
    expect(backAction('/', true)).toBe('minimize');
    expect(backAction('/', false)).toBe('minimize');
    expect(backAction('/?x=1', true)).toBe('minimize');
  });

  it('goes back in the history on other pages', () => {
    expect(backAction('/legal', true)).toBe('history');
    expect(backAction('/group/invitations/abc', true)).toBe('history');
  });

  it('puts the app in the background when there is no previous page', () => {
    expect(backAction('/legal', false)).toBe('minimize');
  });
});
