export const defaultConfig = {
  brand: 'Achados Feed', eyebrow: 'SHOPEE + MERCADO LIVRE',
  title: 'Ofertas selecionadas, cupons e descontos',
  highlight: 'direto no seu celular.',
  subtitle: 'Promoções da Shopee e Mercado Livre direto no seu WhatsApp. Entre grátis!',
  buttonText: 'Entrar no grupo grátis',
  whatsappLink: 'https://chat.whatsapp.com/KNRdWybGdPDEhNZowmRDmC?s=cl&p=a&mlu=4&ilr=4&iam=0',
  pixelId: '',
  offerOrder: ['casio', 'oculos', 'serra', 'massageador', 'oster'], offerHidden: [], offerAutoplay: true,
  announcement: 'OFERTAS DA SHOPEE + MERCADO LIVRE · ENTRADA GRATUITA', showAnnouncement: false,
  footerText: 'Página independente; sem vínculo oficial com WhatsApp, Shopee ou Mercado Livre. Links compartilhados podem ser de afiliados.',
  privacyEmail: '',
  seoTitle: 'Achados Feed | Ofertas, cupons e descontos no WhatsApp',
  seoDescription: 'Achados Feed: ofertas selecionadas, cupons e descontos direto no seu celular. Entre grátis no grupo de WhatsApp.'
};

export function isValidWhatsAppInvite(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'chat.whatsapp.com' && /^\/[A-Za-z0-9_-]{15,80}\/?$/.test(url.pathname) && !url.username && !url.password;
  } catch { return false; }
}

export const validOfferIds = ['casio', 'oculos', 'serra', 'massageador', 'oster'];
const lengths = {brand: 45, eyebrow: 100, title: 130, highlight: 130, subtitle: 260, buttonText: 75, announcement: 120, footerText: 300, privacyEmail: 160, seoTitle: 120, seoDescription: 230};
export function validateConfig(input, previous) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Error('Dados inválidos.');
  const next = {...previous};
  for (const [key, length] of Object.entries(lengths)) {
    if (!(key in input)) continue;
    if (typeof input[key] !== 'string' || input[key].length > length) throw Error(`Campo inválido: ${key}`);
    next[key] = input[key].trim();
  }
  if ('whatsappLink' in input) {
    if (typeof input.whatsappLink !== 'string' || !isValidWhatsAppInvite(input.whatsappLink)) throw Error('Insira um link de convite válido do WhatsApp.');
    next.whatsappLink = input.whatsappLink;
  }
  if ('pixelId' in input) {
    if (typeof input.pixelId !== 'string' || !/^\d{0,25}$/.test(input.pixelId.trim())) throw Error('O Pixel deve conter apenas números (ou ficar vazio).');
    next.pixelId = input.pixelId.trim();
  }
  if ('offerOrder' in input) {
    const ids = input.offerOrder;
    if (!Array.isArray(ids) || ids.length !== validOfferIds.length || new Set(ids).size !== validOfferIds.length || ids.some(id => !validOfferIds.includes(id))) throw Error('Ordem de ofertas inválida.');
    next.offerOrder = [...ids];
  }
  if ('offerHidden' in input) {
    const ids = input.offerHidden;
    if (!Array.isArray(ids) || ids.length > validOfferIds.length || new Set(ids).size !== ids.length || ids.some(id => !validOfferIds.includes(id))) throw Error('Seleção de ofertas inválida.');
    next.offerHidden = [...ids];
  }
  if ('offerAutoplay' in input) {
    if (typeof input.offerAutoplay !== 'boolean') throw Error('Rotação automática inválida.');
    next.offerAutoplay = input.offerAutoplay;
  }
  if ('showAnnouncement' in input) {
    if (typeof input.showAnnouncement !== 'boolean') throw Error('Estado do aviso inválido.');
    next.showAnnouncement = input.showAnnouncement;
  }
  if (next.privacyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.privacyEmail)) throw Error('E-mail de privacidade inválido.');
  if (!next.title || !next.buttonText || !next.brand) throw Error('Preencha os campos principais.');
  return next;
}

export function sanitizeUtm(input = {}) {
  const result = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
    const value = input[key];
    result[key] = typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 100) : '';
  }
  return result;
}
