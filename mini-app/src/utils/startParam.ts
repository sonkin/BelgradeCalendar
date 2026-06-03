import WebApp from '@twa-dev/sdk';

const START_PARAM_DISMISSED_KEY = 'belca_start_param_dismissed';

export function dismissStartParamDeepLink(): void {
  const startParam = WebApp.initDataUnsafe.start_param;
  if (startParam) {
    sessionStorage.setItem(START_PARAM_DISMISSED_KEY, startParam);
  }
}

export function isStartParamDeepLinkDismissed(): boolean {
  const startParam = WebApp.initDataUnsafe.start_param;
  if (!startParam) return false;
  return sessionStorage.getItem(START_PARAM_DISMISSED_KEY) === startParam;
}
