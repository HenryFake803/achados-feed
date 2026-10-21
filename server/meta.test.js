import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMetadata } from './meta.js';

test('Título e descrição são editáveis e sem HTML injetado',()=>{
  const html = '<title>Anterior</title><meta name="description" content="Anterior" /><meta property="og:title" content="Anterior" /><meta property="og:description" content="Anterior" />';
  const output = renderMetadata(html,{seoTitle:'Promoções <b>! &"',seoDescription:'Seleção de ofertas!'});
  assert.ok(output.includes('<title>Promoções &lt;b&gt;! &amp;&quot;</title>'));
  assert.ok(output.includes('property="og:description" content="Seleção de ofertas!"'));
  assert.ok(!output.includes('<b>'));
});
