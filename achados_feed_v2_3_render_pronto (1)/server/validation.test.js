import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultConfig, isValidWhatsAppInvite, sanitizeUtm, validateConfig } from './validation.js';

test('Link do WhatsApp fornecido é válido e preservado', () => {
  assert.equal(isValidWhatsAppInvite(defaultConfig.whatsappLink),true);
  assert.equal(validateConfig({whatsappLink:defaultConfig.whatsappLink},defaultConfig).whatsappLink,defaultConfig.whatsappLink);
});
test('Rejeita convite não-WhatsApp, URL insegura, Pixel inválido',()=>{
  for(const url of ['https://evil.example/fake','javascript:alert(1)','http://chat.whatsapp.com/KNRdWybGdPDEhNZowmRDmC','https://chat.whatsapp.com.evil.com/KNRdWybGdPDEhNZowmRDmC']){
    assert.equal(isValidWhatsAppInvite(url),false);
  }
  assert.throws(()=>validateConfig({pixelId:'1";alert(1)'},defaultConfig));
});
test('Aceita pixel numérico e mantém configurações ausentes',()=>{
  const cfg=validateConfig({pixelId:'123456789012345',title:'Nova chamada'},defaultConfig);
  assert.equal(cfg.pixelId,'123456789012345');
  assert.equal(cfg.whatsappLink,defaultConfig.whatsappLink);
  assert.equal(cfg.title,'Nova chamada');
});
test('UTMs têm tamanho limitado',()=>{
  const utm=sanitizeUtm({utm_source:'facebook',utm_campaign:'x'.repeat(200)});
  assert.equal(utm.utm_source,'facebook');
  assert.equal(utm.utm_campaign.length,100);
});

import { test as carouselTest } from 'node:test';
carouselTest('Permite reorganizar ofertas e alterar rotação sem mudar o convite', () => {
  const order = [...defaultConfig.offerOrder].reverse();
  const saved = validateConfig({offerOrder:order, offerHidden:['oster','serra'],offerAutoplay:false}, defaultConfig);
  assert.deepEqual(saved.offerOrder, order);
  assert.deepEqual(saved.offerHidden, ['oster','serra']);
  assert.equal(saved.offerAutoplay,false);
  assert.equal(saved.whatsappLink, defaultConfig.whatsappLink);
});
carouselTest('Bloqueia duplicação, ID desconhecido e valor indevido no carrossel', () => {
  assert.throws(()=>validateConfig({offerOrder:['casio','oculos','serra','casio','oster']},defaultConfig),/Ordem de ofertas inválida/);
  assert.throws(()=>validateConfig({offerHidden:['https://externo.exemplo/']},defaultConfig),/Seleção de ofertas inválida/);
  assert.throws(()=>validateConfig({offerAutoplay:'true'},defaultConfig),/Rotação automática inválida/);
});
