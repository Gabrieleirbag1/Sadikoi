interface Group {
  id: number;
  name: string;
  description: string;
  users: User[];
  date_created: string;
  daily_reset_timestamp: string;
}