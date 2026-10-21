declare global {
  interface Window { fbq?: ((...args:any[]) => void) & {callMethod?:any;queue?:any[];loaded?:boolean;version?:string;push?:any}; _fbq?:any; }
}
let installedPixel = '';
export function initMetaPixel(id: string) {
  if (!/^\d{5,25}$/.test(id) || installedPixel === id) return;
  // The Meta script is only requested after explicit advertising consent.
  if (!window.fbq) {
    const fn:any = (...args:any[]) => fn.callMethod ? fn.callMethod.apply(fn,args) : fn.queue.push(args);
    fn.queue = [];
    fn.loaded = true;
    fn.version = '2.0';
    window.fbq = fn;
    window._fbq = fn;
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onerror = () => console.warn('Não foi possível carregar o Pixel. Um bloqueador de anúncios pode estar ativo.');
    document.head.appendChild(script);
  }
  window.fbq?.('init', id);
  window.fbq?.('track', 'PageView');
  installedPixel = id;
}
export function trackWhatsAppClick() {
  if (installedPixel) window.fbq?.('trackCustom', 'WhatsAppClick');
}
export function removeMetaCookies() {
  for (const name of ['_fbp','_fbc']) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
  }
}
