/** One switch per notification type (the same names as the API). */
interface NotificationSettings {
  messages: boolean;
  questions: boolean;
  vote_reminder: boolean;
  answers: boolean;
}

/** A group's switches, with the global ones: a type off globally is off for every group. */
interface GroupNotificationSettings {
  group: NotificationSettings;
  global: NotificationSettings;
}
