import { Bot, InlineKeyboard } from 'grammy';
import type { Context } from 'grammy';
import { config, miniAppDirectLink } from '../config.js';

const PINNED_MESSAGE_TEXT =
  '📅 Календарь встреч Belgrade Friends\n\nНажмите кнопку ниже, чтобы посмотреть события и отметить участие.';

function isAdmin(userId: number | undefined): boolean {
  return userId !== undefined && config.telegramAdminIds.includes(userId);
}

function isGroupChat(chatType: string | undefined): boolean {
  return chatType === 'group' || chatType === 'supergroup';
}

/** В группах с топиками отвечаем в тот же топик, иначе сообщение «теряется». */
function topicSendOptions(ctx: Context): { message_thread_id?: number } {
  const threadId = ctx.message?.message_thread_id;
  return threadId !== undefined ? { message_thread_id: threadId } : {};
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
    await ctx.reply(`${text}\n\nКнопка появится когда WEBAPP_URL будет HTTPS (ngrok или belca.jtutor.app).`, {
      ...topicSendOptions(ctx),
    });
    return;
  }
  await ctx.reply(text, {
    reply_markup: calendarKeyboard(inGroup),
    ...topicSendOptions(ctx),
  });
}

export function createInteractiveBot(): Bot {
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
    const topic = topicSendOptions(ctx);

    if (!isAdmin(ctx.from?.id)) {
      await ctx.reply(
        `Команда только для админов календаря (ваш id: ${ctx.from?.id ?? 'неизвестен'}).`,
        topic,
      );
      return;
    }

    const inGroup = isGroupChat(ctx.chat?.type);
    const chatId = inGroup ? ctx.chat!.id : Number(config.telegramChatId);

    if (!chatId) {
      await ctx.reply('Выполни /setup в группе или укажи TELEGRAM_CHAT_ID в .env', topic);
      return;
    }

    if (!inGroup && !config.webappUrl.startsWith('https://')) {
      await ctx.reply('Сначала задай HTTPS в WEBAPP_URL (ngrok или prod), перезапусти сервер.', topic);
      return;
    }

    try {
      const message = await ctx.api.sendMessage(chatId, PINNED_MESSAGE_TEXT, {
        reply_markup: calendarKeyboard(true),
        ...topic,
      });

      try {
        await ctx.api.pinChatMessage(chatId, message.message_id, {
          disable_notification: true,
          ...topic,
        });
        await ctx.reply(
          '✅ Сообщение с кнопкой «Открыть календарь» отправлено и закреплено в этом чате.\n\n' +
            'Кнопка «Календарь» в шапке лички с ботом настраивается при старте сервера (Menu Button в BotFather).',
          topic,
        );
      } catch (pinError) {
        console.error('Pin failed:', pinError);
        await ctx.reply(
          'Сообщение с кнопкой отправлено, но закрепить не удалось.\n\n' +
            'Дай боту право «Закреплять сообщения» или закрепи сообщение вручную.\n\n' +
            `Ошибка: ${formatTelegramError(pinError)}`,
          topic,
        );
      }
    } catch (error) {
      console.error('Setup failed:', error);
      await ctx.reply(
        'Не удалось отправить сообщение.\n\n' +
          'Проверь, что бот — админ группы и может публиковать сообщения.\n\n' +
          `Ошибка: ${formatTelegramError(error)}`,
        topic,
      );
    }
  });

  bot.catch((error) => {
    console.error('Bot error:', error);
  });

  return bot;
}

export async function registerBotCommands(bot: Bot): Promise<void> {
  await bot.api.setMyCommands([
    { command: 'start', description: 'Открыть календарь' },
    { command: 'calendar', description: 'Кнопка календаря' },
    { command: 'setup', description: 'Закрепить пост в группе (админ)' },
  ]);
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
