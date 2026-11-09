/** A piece of a chat message: plain text, or a mention of a group member (`text` is "@name" as typed). */
export interface MessagePart {
  text: string;
  user?: User;
}

/** Letters (any alphabet), digits and "_": a mention can't start or end in the middle of a word. */
const WORD_CHAR = /[\p{L}\p{N}_]/u;
/** Longest text between "@" and the cursor still looked up as a name being typed. */
const MAX_QUERY_LENGTH = 40;

const isWordChar = (char: string | undefined) => !!char && WORD_CHAR.test(char);

/**
 * Splits a message into text and mentions. "@name" is a mention when "name" is a member's username
 * (any case), not glued to a word before or after it (so "mail@name.fr" stays plain text).
 * Usernames can contain spaces: the longest member name that fits wins ("@Jean Paul" over "@Jean").
 */
export function splitMentions(content: string, users: readonly User[]): MessagePart[] {
  const byLength = users.filter(user => user.username).sort((a, b) => b.username.length - a.username.length);
  const parts: MessagePart[] = [];
  let textStart = 0;
  let i = content.indexOf('@');
  while (i !== -1) {
    const user = isWordChar(content[i - 1]) ? undefined : byLength.find(candidate => {
      const name = content.slice(i + 1, i + 1 + candidate.username.length);
      return name.toLowerCase() === candidate.username.toLowerCase() && !isWordChar(content[i + 1 + name.length]);
    });
    if (user) {
      const end = i + 1 + user.username.length;
      if (i > textStart) parts.push({ text: content.slice(textStart, i) });
      parts.push({ text: content.slice(i, end), user });
      textStart = end;
    }
    i = content.indexOf('@', user ? textStart : i + 1);
  }
  if (textStart < content.length) parts.push({ text: content.slice(textStart) });
  return parts;
}

/**
 * The name being typed right before the cursor ("salut @je|" -> { start: 6, query: "je" }), or null.
 * `start` is the position of the "@". The "@" must begin a word, and the name stays on one line.
 */
export function mentionQuery(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const start = before.lastIndexOf('@');
  if (start === -1 || isWordChar(before[start - 1])) return null;
  const query = before.slice(start + 1);
  if (query.length > MAX_QUERY_LENGTH || /[\n@]/.test(query)) return null;
  return { start, query };
}

/** Members whose username starts with what was typed (any case), alphabetically, without `exceptId`. */
export function mentionSuggestions(users: readonly User[], query: string, exceptId: number | undefined, limit = 6): User[] {
  const typed = query.toLowerCase();
  return users
    .filter(user => user.id !== exceptId && user.username?.toLowerCase().startsWith(typed))
    .sort((a, b) => a.username.localeCompare(b.username))
    .slice(0, limit);
}
