# Achados Feed — Landing Page 2.3

Landing page concisa do **Achados Feed** direcionada a visitantes de anúncios pagos de Facebook/Instagram que querem entrar no grupo de ofertas no WhatsApp. Código React + TypeScript + Express; sem Sites ou Lovable.

## Novidades da versão 2.3

- **Miniaturas reais das duas plataformas**, a partir dos arquivos fornecidos pelo administrador: logo laranja da Shopee e logo amarela do Mercado Livre, no início da página.
- **Cinco capturas originais das mensagens do WhatsApp sem cortes**, no lugar dos recortes com enquadramento comprometido da versão anterior. Fotos mantêm sua proporção original, redimensionadas e comprimidas em WebP para reduzir tráfego.
- Moldura branca com canto arredondado e fundo discreto para preservar o contexto da mensagem. No celular, cada print inteiro é mostrado com a proporção original; por isso o carrossel fica mais alto.
- Carrossel com arraste, setas e indicadores, rotação automática mais lenta (~9 segundos, pausada após interação por ~16 segundos, durante hover/foco e se o usuário prefere movimentos reduzidos).
- Mantém a identidade visual azul do Achados Feed, um CTA acima das ofertas, outro no final e um botão fixo no celular.
- Continuam disponíveis no painel o gerenciamento da ordem, visibilidade e autoplay dos cinco prints. **Ainda não existe upload de novas imagens no painel.**

Os prints e logos são os arquivos enviados pelo responsável do grupo. Os logos identificam a origem das ofertas, **sem representar associação comercial ou endosso pelas plataformas**.

## Prévia visual

O arquivo independente **`achados_feed_v2_3_previa.html`** é uma prévia da página pública com as cinco imagens e os dois logos incorporados. Abre no navegador sem instalar dependências. O botão da prévia aponta para o convite fornecido. A prévia não executa autenticação, painel, Pixel nem métricas; o projeto completo sim.

## Instalação e publicação

1. Extraia `achados_feed_v2_3_codigo.zip`.
2. Instale Node.js 22+, depois execute `npm install`.
3. Copie `.env.example` para `.env`. Configure `ADMIN_PASSWORD` com 12+ caracteres e `SESSION_SECRET` com 32+ caracteres gerados aleatoriamente.
4. Execute `npm run dev`. Acesse `http://localhost:5173` (site) e `/admin` (painel).
5. Em produção, use `npm run build` e depois `npm start`. No Render: Build `npm install && npm run build`, Start `npm start`; configure as variáveis sensíveis e `DATABASE_URL` (PostgreSQL recomendado) para dados persistentes.
6. No painel, confira o convite, preencha o e-mail de privacidade, configure o Pixel da Meta e verifique os eventos no Gerenciador de Eventos antes dos anúncios.

## Importante

- O rastreamento do Pixel exige consentimento. O painel conta acessos e cliques no convite `/go`, não adesões efetivas ao grupo WhatsApp.
- Os preços e cupons visíveis nos prints são **ofertas anteriores**, não promessas de preços atuais.
- Em instalações que já possuam dados no banco, os textos e links configurados anteriormente são preservados.
- A página possui aviso de independência de Shopee, Mercado Livre e WhatsApp no rodapé.
- `npm test` testa validações/servidor; a prévia HTML pode ser validada com navegador para verificar imagens e responsividade. O build React depende de instalar as dependências do package.json.

## Deploy organizado com Render Blueprint (`render.yaml`)

Foi incluído um `render.yaml` de **teste**, que provisiona um web service Node e um banco PostgreSQL no plano Free, liga o banco via `DATABASE_URL` e solicita `ADMIN_PASSWORD` no painel (sem gravar senha no Git). O segredo da sessão é gerado automaticamente. Antes de usar o painel, configure uma senha forte de pelo menos 12 caracteres.

> **Não use o plano Free como hospedagem definitiva de campanhas pagas.** O serviço hiberna após ociosidade e pode levar tempo para responder. O PostgreSQL Free expira em 30 dias, com risco de perder configurações e métricas se não for atualizado a tempo. Na fase de produção, considere planos que não hibernem e banco persistente com backup.

O arquivo `.env` está ignorado pelo Git. `render.yaml` não inclui credenciais reais. Assim que o código estiver num repositório GitHub próprio, conecte-o como Blueprint do Render ou configure manualmente um novo Web Service com `npm install && npm run build` e `npm start`.
