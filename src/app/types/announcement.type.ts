/** What happened to yesterday's item, announced after each daily reset. */
interface ItemAnnouncement {
  type: 'new' | 'stolen' | 'kept';
  user: User;
  /** The previous holder, for a stolen item. */
  from_user: User | null;
  item_name: string;
  /** new / kept: the holder's streak; stolen: the streak the previous holder lost. */
  streak: number;
  /** Every member of the group with their current items. */
  members: User[];
}
