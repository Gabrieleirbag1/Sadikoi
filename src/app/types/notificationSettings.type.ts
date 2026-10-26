interface NotificationGroupSetting {
  id: number;
  name: string;
  muted: boolean;
}

interface NotificationSettings {
  messages: boolean;
  questions: boolean;
  vote_reminder: boolean;
  groups: NotificationGroupSetting[];
}
