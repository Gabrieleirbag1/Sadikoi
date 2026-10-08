interface Group {
  id: number;
  name: string;
  description: string;
  users: User[];
  date_created: string;
  daily_reset_timestamp: string;
  themes: string[];
  has_user_voted_today: boolean;
  question: Question;
}