import React, {useEffect, useRef, useState} from 'react';
import {
  ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign,
  Gift, Heart, MessageCircle, MousePointerClick, ShieldCheck, ShoppingBag,
  ShoppingCart, Sparkles, Tag, TicketPercent, Zap
} from 'lucide-react';
import type {Config} from './types';
import {fallbackConfig, gotoUrl, request, trackingParams} from './types';
import {initMetaPixel, removeMetaCookies, trackWhatsAppClick} from './pixel';
import {Admin} from './Admin';
import {visibleOffers} from './offers';

const consentKey = 'ofertas_ads_consent_v1';
type Consent = 'accepted'|'rejected'|null;
const logoPath = '/achados-feed-logo.jpg';
const offerPath = '/exemplo-promocao-whatsapp.jpg';

function Brand({name}: {name:string}) {
  return <span className="af-brand"><img src={logoPath} alt="Logo do Achados Feed: sacola de compras azul" width="48" height="48"/><span className="af-brand-name">{name}<small>Seu grupo de achadinhos</small></span></span>;
}

function CTA({config, className='', small=false, onClick}: {config:Config;className?:string;small?:boolean;onClick?:()=>void}) {
  return <a className={`af-cta ${className} ${small?'af-cta-small':''}`} href={gotoUrl()} target="_blank" rel="noopener noreferrer" onClick={onClick}>
    <MessageCircle size={small?19:22} aria-hidden="true" strokeWidth={2.4}/>
    <span>{config.buttonText}</span><ArrowUpRight size={small?17:19} aria-hidden="true"/>
  </a>;
}

function ExampleOffer({compact=false}:{compact?:boolean}) {
  return <div className={`af-offer-phone ${compact?'af-offer-phone-mini':''}`}>
    <img src={offerPath} width="576" height="1280" loading={compact?'eager':'lazy'} decoding="async" alt="Captura de uma publicação anterior do grupo Achados Feed no WhatsApp, mostrando uma Air Fryer Oster, preço, cupom e link da oferta"/>
  </div>;
}

function CookieBanner({onChange,onClose}: {onChange:(value:Consent)=>void;onClose:()=>void}) {
  return <div className="cookie-overlay"><div className="cookie-panel" role="dialog" aria-label="Preferências de privacidade" aria-modal="false">
    <div className="cookie-symbol"><ShieldCheck size={21}/></div>
    <div className="cookie-copy"><strong>Seu controle, sua privacidade.</strong><p>Com sua autorização, usamos o Pixel da Meta para medir a eficácia dos anúncios. Também contabilizamos visitas e cliques de forma agregada. <a href="/privacidade">Saiba mais</a>.</p></div>
    <div className="cookie-actions"><button className="cookie-reject" onClick={()=>{onChange('rejected');onClose();}}>Recusar</button><button className="cookie-accept" onClick={()=>{onChange('accepted');onClose();}}>Aceitar anúncios</button></div>
  </div></div>;
}

function Footer({config,onCookieSettings}: {config:Config;onCookieSettings:()=>void}) {
  return <footer className="af-footer"><div className="container"><div className="af-footer-top"><Brand name={config.brand}/><div className="af-footer-links"><a href="/privacidade">Privacidade</a><button onClick={onCookieSettings}>Preferências de cookies</button><a href="/admin" rel="nofollow">Admin</a></div></div><div className="af-footer-bottom"><span>© {new Date().getFullYear()} {config.brand}. {config.footerText}</span><span>Preços, estoques e cupons podem mudar. As ofertas exibidas são exemplos anteriores.</span></div></div></footer>;
}

/** Lightweight rotating proof gallery: pauses on interaction and reduced motion. */
function OfferCarousel({config}: {config:Config}) {
  const offers = visibleOffers(config.offerOrder, config.offerHidden);
  const [index,setIndex] = useState(0);
  const [hovered,setHovered] = useState(false);
  const [focused,setFocused] = useState(false);
  const [visible,setVisible] = useState(true);
  const lastInteraction = useRef(0);
  const touchStart = useRef<{x:number;y:number}|null>(null);
  const count = offers.length;
  const reducedMotion = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {reducedMotion.current=mq.matches;};
    update(); mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  },[]);
  useEffect(() => {
    const handler = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange',handler);
  },[]);
  useEffect(() => {setIndex(i => count ? Math.min(i,count-1) : 0);},[count]);
  useEffect(() => {
    if (!config.offerAutoplay || count <= 1 || hovered || focused || !visible) return;
    const timer = window.setInterval(() => {
      if (!reducedMotion.current && Date.now()-lastInteraction.current > 16000) setIndex(i => (i+1)%count);
    }, 9000);
    return () => window.clearInterval(timer);
  },[config.offerAutoplay,count,hovered,focused,visible]);
  const goTo = (n:number) => {lastInteraction.current=Date.now();setIndex((n+count)%count);};
  if (!count) return null;
  return <div className="s22-carousel" role="region" aria-roledescription="carrossel" aria-label="Exemplos de promoções anteriores, capturas completas do WhatsApp"
    onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
    onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);}}
    onTouchStart={e=>{const t=e.touches[0];touchStart.current={x:t.clientX,y:t.clientY};}}
    onTouchEnd={e=>{const start=touchStart.current;touchStart.current=null;if(!start)return;const t=e.changedTouches[0];const dx=t.clientX-start.x;const dy=t.clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)goTo(index+(dx<0?1:-1));}}>
    <div className="s22-viewport"><div className="s22-track" style={{transform:`translateX(-${index*100}%)`}}>
      {offers.map((offer,i)=><div className="s22-slide" key={offer.id} aria-hidden={i!==index}>
        <img src={offer.src} alt={i===index?offer.alt:''} decoding="async" loading={i<=1?'eager':'lazy'} draggable={false} width={offer.width} height={offer.height} />
      </div>)}
    </div></div>
    {count>1 && <div className="s22-controls">
      <button className="s22-arrow" type="button" aria-label="Oferta anterior" onClick={()=>goTo(index-1)}><ChevronLeft size={18}/></button>
      <span className="s22-count">{index+1} de {count}</span>
      <div className="s22-dots" aria-label="Escolher oferta">{offers.map((offer,i)=><button type="button" key={offer.id} aria-label={`Mostrar oferta ${i+1}: ${offer.title}`} aria-current={index===i?'true':undefined} className={index===i?'active':''} onClick={()=>goTo(i)}/>)}</div>
      <button className="s22-arrow" type="button" aria-label="Próxima oferta" onClick={()=>goTo(index+1)}><ChevronRight size={18}/></button>
    </div>}
    <p className="s22-product-name">{offers[index]?.title}</p>
  </div>;
}

function Landing({config, onCookieSettings}: {config:Config;onCookieSettings:()=>void}) {
  useEffect(()=>{
    document.title = config.seoTitle || fallbackConfig.seoTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', config.seoDescription);
  },[config]);
  const ctaClicked = () => trackWhatsAppClick();
  return <div className="af-page af-v21 af-v23">
    {config.showAnnouncement && <div className="s21-announcement">{config.announcement}</div>}
    <header className="s21-header"><div className="s21-shell s21-header-content">
      <a href="/" aria-label="Achados Feed — início"><Brand name={config.brand}/></a>
      <span className="s21-free"><CheckCircle2 size={15}/> 100% gratuito</span>
    </div></header>
    <main>
      <section className="s21-hero"><div className="s21-shell s21-grid">
        <div className="s21-intro">
          <div className="s23-platforms" aria-label="Ofertas das plataformas Shopee e Mercado Livre">
            <span className="s23-platform"><img src="/logo-shopee.webp" alt="Logotipo da Shopee" width="44" height="44" decoding="async"/><span>Shopee</span></span>
            <span className="s23-platform"><img src="/logo-mercado-livre.webp" alt="Logotipo do Mercado Livre" width="44" height="44" decoding="async"/><span>Mercado Livre</span></span>
          </div>
          <h1>{config.title} <em>{config.highlight}</em></h1>
          <p className="s21-subtitle">{config.subtitle}</p>
          <CTA config={config} className="s21-main-cta" onClick={ctaClicked}/>
          <div className="s21-promises" aria-label="Benefícios do grupo"><span><Check size={16}/> Grátis</span><span><Check size={16}/> Cupons</span><span><Check size={16}/> Ofertas</span></div>
          <a className="s21-example-link" href="#exemplo">Veja ofertas reais <ArrowRight size={16}/></a>
        </div>
        <div className="s21-example" id="exemplo">
          <h2>Veja algumas ofertas que já passaram por aqui <span aria-hidden="true">👇</span></h2>
          <p className="s22-subheading">Capturas reais do nosso WhatsApp, sem recortes.</p>
          <div className="s21-offer-card s22-offer-card">
            <div className="s21-offer-top"><span className="s21-live"/><strong>Direto do WhatsApp</strong><span className="s21-example-badge">OFERTAS ANTERIORES</span></div>
            <OfferCarousel config={config}/>
          </div>
          <p className="s21-disclaimer">Exemplos anteriores. Preços, cupons e disponibilidade podem mudar.</p>
        </div>
      </div></section>
      <section className="s21-last"><div className="s21-shell s21-last-inner">
        <h2>Gostou? Vem para o <span>Achados Feed!</span></h2>
        <CTA config={config} className="s21-last-cta" onClick={ctaClicked}/>
        <p>Gratuito. Você escolhe quais ofertas aproveitar.</p>
      </div></section>
    </main>
    <footer className="s21-footer"><div className="s21-shell">
      <p><strong>{config.brand}</strong> · {config.footerText}</p>
      <div className="s21-footer-actions"><a href="/privacidade">Privacidade</a><button type="button" onClick={onCookieSettings}>Preferências de cookies</button><a href="/admin" rel="nofollow">Admin</a></div>
    </div></footer>
    <div className="s21-sticky"><CTA config={config} small onClick={ctaClicked}/></div>
  </div>;
}

function Privacy({config,onCookieSettings}: {config:Config;onCookieSettings:()=>void}) {
  useEffect(()=>{document.title=`Privacidade | ${config.brand}`;},[config]);
  return <><header className="site-header"><div className="container nav-inner"><a href="/" className="brand-link"><Brand name={config.brand}/></a><a href="/" className="return-link">Voltar ao site <ArrowRight size={16}/></a></div></header><main className="policy container"><span className="section-kicker">TRANSPARÊNCIA</span><h1>Política de Privacidade</h1><p className="policy-date">Última atualização: outubro de 2026</p><p>Esta página explica como este site de divulgação de grupos de ofertas utiliza informações de acesso, métricas e ferramentas publicitárias.</p><h2>1. Dados coletados</h2><p>Contabilizamos visualizações da página e acessos ao convite do WhatsApp, além dos parâmetros de origem de campanhas (UTM) presentes na URL. Essas métricas são agregadas no painel administrativo, sem guardar nome, telefone, endereço IP ou um identificador individual dos visitantes em nosso banco de estatísticas.</p><h2>2. Pixel da Meta</h2><p>Com sua autorização, o site pode carregar o Pixel da Meta (Facebook/Instagram) para registrar a visualização da página e os cliques no convite de WhatsApp. A Meta pode tratar dados segundo suas próprias políticas. Sem seu consentimento, não carregamos o Pixel.</p><h2>3. Como gerenciar o consentimento</h2><p>Você pode rejeitar o rastreamento publicitário e alterar sua escolha a qualquer momento pelo botão “Preferências de cookies” no rodapé. Os registros agregados de acesso são mantidos por até 90 dias em nossa base, sem dados pessoais diretamente identificadores.</p><h2>4. Links e serviços externos</h2><p>Ao clicar para entrar no grupo, você é redirecionado ao WhatsApp, um serviço externo. Eventuais compras em Shopee ou Mercado Livre estão sujeitas às políticas e condições dessas plataformas. Esta página não solicita dados de pagamento.</p><h2>5. Contato</h2><p>{config.privacyEmail ? <>Para assuntos de privacidade, escreva para <a href={`mailto:${config.privacyEmail}`}>{config.privacyEmail}</a>.</> : <>Para solicitações sobre privacidade, procure o administrador pelos canais divulgados no grupo. O responsável pela página deve cadastrar um e-mail de contato no painel.</>}</p><p className="policy-disclaimer">Esta política descreve o funcionamento técnico implementado no site; a responsabilidade pela adequação jurídica e pelos dados do responsável pela operação é do administrador.</p></main><Footer config={config} onCookieSettings={onCookieSettings}/></>;
}

export function App() {
  const [config,setConfig] = useState<Config>(fallbackConfig);
  const [loaded,setLoaded] = useState(false);
  const [error,setError] = useState('');
  const [consent,setConsent] = useState<Consent>(()=>{
    try { const v = localStorage.getItem(consentKey); return v === 'accepted'|| v === 'rejected' ? v : null; } catch { return null; }
  });
  const [cookiesOpen,setCookiesOpen] = useState(consent === null);
  const counted = useRef(false);
  const route = window.location.pathname;
  const isAdmin = route === '/admin' || route.startsWith('/admin/');
  useEffect(()=>{
    if (isAdmin) return;
    request<Config>('/api/public/config').then(c=>{setConfig(c);setLoaded(true);}).catch(e=>{setError(e.message);setLoaded(true);});
  },[isAdmin]);
  useEffect(()=>{
    if (isAdmin || route === '/privacidade' || counted.current) return;
    counted.current = true;
    const params = trackingParams();
    fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'page_view',...Object.fromEntries(params)}),keepalive:true}).catch(()=>{});
  },[isAdmin,route]);
  useEffect(()=>{
    if (!isAdmin && consent === 'accepted' && config.pixelId) initMetaPixel(config.pixelId);
  },[isAdmin, consent, config.pixelId]);
  function changeConsent(v:Consent) {
    if(v) try { localStorage.setItem(consentKey,v); } catch {/* private mode */}
    if (v === 'rejected' && consent === 'accepted') {
      removeMetaCookies();
      window.location.reload();
    }
    setConsent(v);
  }
  if (isAdmin) return <Admin/>;
  return <>
    {error && <div className="connection-warning">Não conseguimos carregar as configurações atuais. {error} <button onClick={()=>window.location.reload()}>Tentar novamente</button></div>}
    {route === '/privacidade' ? <Privacy config={config} onCookieSettings={()=>setCookiesOpen(true)}/> : <Landing config={config} onCookieSettings={()=>setCookiesOpen(true)}/>}
    {cookiesOpen && loaded && <CookieBanner onChange={changeConsent} onClose={()=>setCookiesOpen(false)}/>}
  </>;
}
