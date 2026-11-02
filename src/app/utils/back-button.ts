/** What Android's back button does: go to home, go back in the history, or put the app in the background. */
export type BackAction = 'home' | 'history' | 'minimize';

const GROUP_PAGE = /^\/group\/\d+(?:[/?#]|$)/;

/**
 * - In a group: always home, even when the group was opened from a notification or another group.
 * - On home: it is the first screen, so the app goes to the background.
 * - Elsewhere: the previous page, or the background when there is none.
 */
export function backAction(url: string, canGoBack: boolean): BackAction {
  if (GROUP_PAGE.test(url)) return 'home';
  const path = url.split(/[?#]/)[0];
  if (path === '/' || path === '') return 'minimize';
  return canGoBack ? 'history' : 'minimize';
}
