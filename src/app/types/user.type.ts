interface User {
  id: number;
  username: string;
  email: string;
  profile_picture?: string;
  date_created: string;
  language: Language;
  items?: Item[];
  role?: string;
}