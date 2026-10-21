export function captureUtms(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utms: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'src', 'fbclid'].forEach((key) => {
    const val = params.get(key);
    if (val) {
      utms[key] = val;
      sessionStorage.setItem(key, val);
    } else {
      const stored = sessionStorage.getItem(key);
      if (stored) utms[key] = stored;
    }
  });
  return utms;
}

export function captureLandingAndReferrer() {
  if (!sessionStorage.getItem('landing_page')) {
    sessionStorage.setItem('landing_page', window.location.href);
  }
  if (!sessionStorage.getItem('referrer') && document.referrer) {
    sessionStorage.setItem('referrer', document.referrer);
  }
}
