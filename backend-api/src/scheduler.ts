import cron from 'node-cron';
import { config } from './config.js';
import { runReminderJob } from './services/reminderService.js';

export function startScheduler(): void {
  if (!config.remindersEnabled) {
    console.log('Event reminders: disabled (REMINDERS_ENABLED=false)');
    return;
  }

  if (!config.telegramChatId) {
    console.warn('Event reminders: TELEGRAM_CHAT_ID not set — scheduler idle');
    return;
  }

  cron.schedule(
    '*/1 * * * *',
    () => {
      void runReminderJob().catch((error) => {
        console.error('Reminder job failed:', error);
      });
    },
    { timezone: config.timezone },
  );

  void runReminderJob().catch((error) => {
    console.error('Reminder job (startup) failed:', error);
  });

  console.log(`Event reminders: cron */1 * * * * (${config.timezone}) → group ${config.telegramChatId}`);
}
