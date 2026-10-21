/** Historical promotion screenshots supplied by the Achados Feed group administrator. */
export const offerCatalog = [
  {id: 'casio', title: 'Relógio Casio', src: '/oferta-casio.webp', width:850, height:1890, alt: 'Print anterior do grupo Achados Feed com relógio Casio, preço e cupom.'},
  {id: 'oculos', title: 'Óculos esportivo', src: '/oferta-oculos.webp', width:850, height:1890, alt: 'Print anterior do grupo Achados Feed com óculos esportivo, desconto e link.'},
  {id: 'serra', title: 'Serra mármore', src: '/oferta-serra.webp', width:850, height:1890, alt: 'Print anterior do grupo Achados Feed com serra mármore, preço promocional e cupom.'},
  {id: 'massageador', title: 'Massageador de pescoço', src: '/oferta-massageador.webp', width:850, height:1890, alt: 'Print anterior do grupo Achados Feed com massageador para pescoço e link.'},
  {id: 'oster', title: 'Air Fryer Oster', src: '/oferta-oster.webp', width:576, height:1280, alt: 'Print anterior do grupo Achados Feed com Air Fryer Oster, preço e cupom.'},
] as const;
export type OfferId = typeof offerCatalog[number]['id'];
export function visibleOffers(order: string[] | undefined, hidden: string[] | undefined) {
  const ordered = Array.isArray(order) ? order : offerCatalog.map(o => o.id);
  const hiddenSet = new Set(Array.isArray(hidden) ? hidden : []);
  return ordered.map(id => offerCatalog.find(o => o.id === id)).filter((o): o is typeof offerCatalog[number] => Boolean(o && !hiddenSet.has(o.id)));
}
