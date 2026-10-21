// Utilitários de coleta de dados de marketing/analytics

const SESSION_KEY = 'ms_session_id';
const UTM_KEY = 'ms_utm_data';
const LANDING_KEY = 'ms_landing';
const REFERRER_KEY = 'ms_referrer';

export interface UtmData {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

export interface DeviceInfo {
  device_type: string;
  browser: string;
  os: string;
}

export const getOrCreateSessionId = (): string => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

export const captureUtms = (): UtmData => {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
  const fresh: UtmData = {};
  let hasFresh = false;
  keys.forEach((k) => {
    const v = params.get(k);
    if (v) {
      fresh[k] = v;
      hasFresh = true;
    }
  });

  if (hasFresh) {
    sessionStorage.setItem(UTM_KEY, JSON.stringify(fresh));
    return fresh;
  }

  // recupera UTMs salvos da primeira página
  try {
    const stored = sessionStorage.getItem(UTM_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

export const captureLandingAndReferrer = () => {
  if (!sessionStorage.getItem(LANDING_KEY)) {
    sessionStorage.setItem(LANDING_KEY, window.location.pathname + window.location.search);
  }
  if (!sessionStorage.getItem(REFERRER_KEY)) {
    sessionStorage.setItem(REFERRER_KEY, document.referrer || '');
  }
  return {
    landing_page: sessionStorage.getItem(LANDING_KEY) || '',
    referrer: sessionStorage.getItem(REFERRER_KEY) || '',
  };
};

export const detectDevice = (): DeviceInfo => {
  const ua = navigator.userAgent;
  const lower = ua.toLowerCase();

  let device_type = 'desktop';
  if (/tablet|ipad|playbook|silk/.test(lower)) device_type = 'tablet';
  else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(lower)) device_type = 'mobile';

  let browser = 'other';
  if (/edg\//.test(lower)) browser = 'Edge';
  else if (/chrome\//.test(lower) && !/edg\//.test(lower)) browser = 'Chrome';
  else if (/firefox\//.test(lower)) browser = 'Firefox';
  else if (/safari\//.test(lower) && !/chrome\//.test(lower)) browser = 'Safari';
  else if (/opera|opr\//.test(lower)) browser = 'Opera';

  let os = 'other';
  if (/windows/.test(lower)) os = 'Windows';
  else if (/iphone|ipad|ipod/.test(lower)) os = 'iOS';
  else if (/android/.test(lower)) os = 'Android';
  else if (/macintosh|mac os/.test(lower)) os = 'macOS';
  else if (/linux/.test(lower)) os = 'Linux';

  return { device_type, browser, os };
};
