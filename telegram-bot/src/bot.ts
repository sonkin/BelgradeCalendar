import { Bot, InlineKeyboard } from 'grammy';
import type { Context } from 'grammy';
import { config, miniAppDirectLink } from './config.js';

const PINNED_MESSAGE_TEXT =
  '📅 Календарь встреч Belgrade Friends\n\nНажмите кнопку ниже, чтобы посмотреть события и отметить участие.';

function isAdmin(userId: number | undefined): boolean {
  return userId !== undefined && config.telegramAdminIds.includes(userId);
}

function isGroupChat(chatType: string | undefined): boolean {
  return chatType === 'group' || chatType === 'supergroup';
}

/** web_app работает только в личке; в группах — ссылка t.me/?startapp */
function calendarKeyboard(inGroup: boolean): InlineKeyboard {
  if (inGroup || !config.webappUrl.startsWith('https://')) {
    return new InlineKeyboard().url('📅 Открыть календарь', miniAppDirectLink());
  }
  return new InlineKeyboard().webApp('📅 Открыть календарь', config.webappUrl);
}

function formatTelegramError(error: unknown): string {
  if (error && typeof error === 'object' && 'description' in error) {
    return String((error as { description: string }).description);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Неизвестная ошибка';
}

async function replyWithCalendarButton(ctx: Context, text: string): Promise<void> {
  const inGroup = isGroupChat(ctx.chat?.type);
  if (!inGroup && !config.webappUrl.startsWith('https://')) {
    await ctx.reply(`${text}\n\nКнопка появится когда WEBAPP_URL будет HTTPS (ngrok или belca.jtutor.app).`);
    return;
  }
  await ctx.reply(text, { reply_markup: calendarKeyboard(inGroup) });
}

export function createBot(): Bot {
  const bot = new Bot(config.botToken);

  bot.command('start', async (ctx) => {
    await replyWithCalendarButton(
      ctx,
      'Привет! Это календарь встреч Belgrade Friends.\n\nНажми кнопку ниже, чтобы открыть календарь.',
    );
  });

  bot.command('calendar', async (ctx) => {
    await replyWithCalendarButton(ctx, 'Календарь встреч:');
  });

  bot.command('setup', async (ctx) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.reply('Команда только для админов.');
      return;
    }

    const inGroup = isGroupChat(ctx.chat?.type);
    const chatId = inGroup ? ctx.chat!.id : Number(config.telegramChatId);

    if (!chatId) {
      await ctx.reply('Выполни /setup в группе или укажи TELEGRAM_CHAT_ID в .env');
      return;
    }

    if (!inGroup && !config.webappUrl.startsWith('https://')) {
      await ctx.reply('Сначала задай HTTPS в WEBAPP_URL (ngrok или prod), перезапусти бота.');
      return;
    }

    try {
      const message = await ctx.api.sendMessage(chatId, PINNED_MESSAGE_TEXT, {
        reply_markup: calendarKeyboard(true),
      });

      try {
        await ctx.api.pinChatMessage(chatId, message.message_id, { disable_notification: true });
        await ctx.reply('✅ Сообщение с кнопкой закреплено.');
      } catch (pinError) {
        console.error('Pin failed:', pinError);
        await ctx.reply(
          'Сообщение с кнопкой отправлено, но закрепить не удалось.\n\n' +
            'Дай боту право «Закреплять сообщения» или закрепи сообщение вручную.\n\n' +
            `Ошибка: ${formatTelegramError(pinError)}`,
        );
      }
    } catch (error) {
      console.error('Setup failed:', error);
      await ctx.reply(
        'Не удалось отправить сообщение.\n\n' +
          'Проверь, что бот — админ группы и может публиковать сообщения.\n\n' +
          `Ошибка: ${formatTelegramError(error)}`,
      );
    }
  });

  bot.catch((error) => {
    console.error('Bot error:', error);
  });

  return bot;
}

export async function setupMenuButton(bot: Bot): Promise<void> {
  if (!config.webappUrl.startsWith('https://')) {
    console.warn('WEBAPP_URL is not HTTPS — menu button skipped (required for Mini App)');
    return;
  }

  await bot.api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Календарь',
      web_app: { url: config.webappUrl },
    },
  });
}
