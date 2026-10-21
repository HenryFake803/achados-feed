export type Config = {
  brand: string; eyebrow: string; title: string; highlight: string;
  subtitle: string; buttonText: string; whatsappLink?: string;
  pixelId: string; announcement: string; showAnnouncement: boolean;
  footerText: string; privacyEmail: string; seoTitle: string; seoDescription: string;
  offerOrder: string[]; offerHidden: string[]; offerAutoplay: boolean;
};
export type StatItem = { label: string; page_view: number; whatsapp_click: number };
export type Stats = {
  days: number; pageViews: number; clicks: number; ctr: number;
  daily: {date:string;page_view:number;whatsapp_click:number}[];
  sources: StatItem[]; campaigns: StatItem[];
};
export const fallbackConfig: Config = {
  brand:'Achados Feed', eyebrow:'SHOPEE + MERCADO LIVRE',
  title:'Ofertas selecionadas, cupons e descontos',
  highlight:'direto no seu celular.',
  subtitle:'Promoções da Shopee e Mercado Livre direto no seu WhatsApp. Entre grátis!',
  buttonText:'Entrar no grupo grátis', pixelId:'',
  offerOrder: ['casio', 'oculos', 'serra', 'massageador', 'oster'], offerHidden: [], offerAutoplay: true,
  announcement:'OFERTAS DA SHOPEE + MERCADO LIVRE · ENTRADA GRATUITA', showAnnouncement:false,
  footerText:'Página independente; sem vínculo oficial com WhatsApp, Shopee ou Mercado Livre. Links compartilhados podem ser de afiliados.',
  privacyEmail:'', seoTitle:'Achados Feed | Ofertas, cupons e descontos no WhatsApp',
  seoDescription:'Achados Feed: ofertas selecionadas, cupons e descontos direto no seu celular. Entre grátis no grupo de WhatsApp.'
};

export const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_content'] as const;
export function trackingParams() {
  const query = new URLSearchParams(window.location.search);
  const next = new URLSearchParams();
  for (const key of utmKeys) if (query.has(key)) next.set(key, query.get(key)!.slice(0,100));
  return next;
}
export function gotoUrl() {
  const param = trackingParams().toString();
  return `/go${param ? '?' + param : ''}`;
}
export async function request<T>(url:string, options?:RequestInit): Promise<T> {
  let r:Response;
  try { r = await fetch(url, {credentials: 'same-origin', ...options, headers:{ ...(options?.body ? {'Content-Type':'application/json'}:{}), ...options?.headers }}); }
  catch { throw new Error('Sem conexão com o servidor. Verifique sua internet.'); }
  let data: any = null;
  try { data = await r.json(); } catch {/* 204 */}
  if (!r.ok) throw new Error(data?.error || `Erro ${r.status}`);
  return data as T;
}
