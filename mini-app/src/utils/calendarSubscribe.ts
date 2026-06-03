import WebApp from '@twa-dev/sdk';

const DESKTOP_PLATFORMS = new Set([
  'macos',
  'tdesktop',
  'weba',
  'webk',
  'unigram',
  'unknown',
]);

const IOS_APPLE_COPY_MESSAGE =
  'Ссылка скопирована.\n\n' +
  'Если открылся Safari — подтвердите подписку на календарь.\n\n' +
  'Если Safari не открылся: Calendar → Calendars → Add Calendar → Add Subscription Calendar → вставьте ссылку.';

const DESKTOP_APPLE_COPY_MESSAGE =
  'Ссылка скопирована.\n\nApple Calendar: Файл → Новая подписка на календарь → вставьте ссылку.';

async function copySubscriptionLink(url: string, message: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    WebApp.showAlert(message);
  } catch {
    WebApp.showAlert('Не удалось скопировать ссылку');
  }
}

export function isIosPlatform(): boolean {
  return WebApp.platform === 'ios';
}

export function isDesktopTelegramPlatform(): boolean {
  return DESKTOP_PLATFORMS.has(WebApp.platform);
}

export function getAppleCalendarButtonLabel(): string {
  return isIosPlatform()
    ? 'Подписаться в Apple Calendar'
    : 'Скопировать для Apple Calendar';
}

export async function subscribeAppleCalendar(webcalUrl: string, httpsUrl: string): Promise<void> {
  if (isIosPlatform()) {
    // webcal:// из WebView Telegram на iOS обычно блокируется — открываем https в Safari
    try {
      await navigator.clipboard.writeText(httpsUrl);
    } catch {
      WebApp.showAlert('Не удалось скопировать ссылку');
      return;
    }

    try {
      WebApp.openLink(httpsUrl);
    } catch {
      WebApp.showAlert(IOS_APPLE_COPY_MESSAGE);
      return;
    }

    WebApp.showAlert(IOS_APPLE_COPY_MESSAGE);
    return;
  }

  await copySubscriptionLink(webcalUrl, DESKTOP_APPLE_COPY_MESSAGE);
}

export async function copyForGoogleCalendar(httpsUrl: string): Promise<void> {
  if (WebApp.platform === 'android' || WebApp.platform === 'android_x') {
    try {
      WebApp.openLink(httpsUrl);
      return;
    } catch {
      // fallback to copy
    }
  }

  await copySubscriptionLink(
    httpsUrl,
    'Ссылка скопирована.\n\nGoogle Calendar: Настройки → Добавить календарь → Из URL.',
  );
}

export function getGoogleCalendarButtonLabel(): string {
  if (WebApp.platform === 'android' || WebApp.platform === 'android_x') {
    return 'Открыть в Google Calendar';
  }
  return 'Скопировать для Google Calendar';
}
