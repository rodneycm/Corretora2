# NORMAS DA PLATAFORMA

## Stephanie Campos Consultoria Imobiliaria

| Campo | Informacao |
| ----- | ---------- |
| Projeto | Stephanie Campos Consultoria Imobiliaria |
| Versao | 1.0 |
| Status | Documento Normativo |
| Responsavel | Stephanie Campos |
| Documento relacionado | ROADMAP_EXECUTIVO.md |
| Documento seguinte | FUNCTIONAL_SPECIFICATION.md |

---

## 01 - Finalidade

Este documento estabelece as normas permanentes da plataforma Stephanie Campos Consultoria Imobiliaria.

Sua finalidade e orientar todas as decisoes futuras relacionadas ao frontend, backend, banco de dados, portal administrativo, integracoes, automacoes, publicacao, seguranca, midia, SEO e evolucoes da plataforma.

As regras aqui definidas deverao ser respeitadas por qualquer desenvolvimento futuro. Nenhuma nova funcionalidade devera contrariar os principios, padroes e diretrizes estabelecidos neste documento.

Este documento representa a base normativa da plataforma e devera servir como referencia obrigatoria antes de qualquer alteracao relevante no projeto.

---

## 02 - Filosofia

A plataforma devera preservar uma experiencia profissional, clara e confiavel, sempre alinhada ao posicionamento da Stephanie Campos Consultoria Imobiliaria.

Os principios fundamentais da plataforma sao:

- Simplicidade.
- Elegancia.
- Clareza.
- Velocidade.
- Seguranca.
- Qualidade.
- Atendimento humanizado.
- Experiencia premium.

Toda evolucao devera respeitar a ideia de que o sistema existe para facilitar a operacao da consultoria e melhorar a experiencia do cliente.

A tecnologia devera permanecer invisivel para o usuario final sempre que possivel. O sistema deve resolver a complexidade internamente, oferecendo uma experiencia simples, segura e intuitiva.

---

## 03 - Regras Gerais

Nenhuma funcionalidade devera ser publicada de forma incompleta, instavel ou desalinhada ao padrao da plataforma.

Toda nova entrega devera respeitar as seguintes regras:

- Nunca sacrificar performance.
- Nunca sacrificar experiencia do usuario.
- Nunca quebrar compatibilidade mobile.
- Nunca comprometer a seguranca.
- Nunca reduzir a qualidade visual ja estabelecida.
- Nunca publicar recursos sem validacao minima.
- Nunca introduzir complexidade desnecessaria para o administrador.
- Sempre preservar a organizacao do projeto.
- Sempre manter consistencia visual e funcional.
- Sempre considerar manutencao futura.

Toda nova funcionalidade devera manter o padrao visual existente, a clareza de navegacao, a velocidade de carregamento e a simplicidade operacional.

A plataforma devera evoluir de forma modular, organizada e controlada, evitando improvisos que dificultem crescimento, manutencao ou auditoria.

---

## 04 - Regras para Imoveis

Todo imovel cadastrado na plataforma devera possuir dados completos, consistentes e preparados para exibicao publica, gestao administrativa e crescimento futuro.

Todo imovel devera possuir obrigatoriamente:

- Slug unico.
- Imagem principal.
- Categoria.
- Status.
- Bairro.
- Cidade.
- Descricao.
- SEO.
- Dados completos.
- Historico.

O cadastro de imoveis devera priorizar clareza, consistencia e confiabilidade das informacoes.

Nenhum imovel devera ser publicado sem validacao dos campos essenciais. O sistema devera impedir publicacoes incompletas ou inconsistentes.

Cada imovel devera manter historico de alteracoes relevantes, incluindo alteracoes de preco, status, descricao, imagens, SEO e publicacao.

Os imoveis deverao poder evoluir de rascunho para publicado, reservado, vendido, alugado, indisponivel ou arquivado, sem perda de informacoes importantes.

---

## 05 - Regras para Imagens

Toda imagem enviada para a plataforma devera passar por tratamento automatico antes de ser disponibilizada publicamente.

Toda imagem enviada devera:

- Gerar backup.
- Receber marca d'agua.
- Ser convertida automaticamente para WebP.
- Estar preparada para futura conversao AVIF.
- Gerar miniaturas.
- Manter qualidade elevada.
- Manter tamanho otimizado.
- Organizar biblioteca automaticamente.

O administrador nao devera precisar renomear, converter, comprimir ou preparar imagens manualmente.

A plataforma devera preservar qualidade visual adequada para apresentacao premium dos imoveis, mantendo ao mesmo tempo carregamento rapido e uso eficiente de armazenamento.

As imagens deverao ser organizadas por imovel, finalidade e versao, permitindo manutencao, auditoria, backup e futuras melhorias no pipeline de midia.

---

## 06 - Regras do Portal Administrativo

O Portal Administrativo devera ser simples, seguro e intuitivo, permitindo que a administracao da plataforma ocorra sem conhecimento tecnico.

O administrador nao devera precisar conhecer:

- WebP.
- AVIF.
- Compressao.
- SEO.
- Cache.
- Banco de Dados.

O sistema devera realizar automaticamente as tarefas tecnicas necessarias para cadastro, publicacao, otimizacao, organizacao e manutencao dos imoveis.

A interface administrativa devera usar linguagem clara, objetiva e orientada a acao. Mensagens de erro, alertas e validacoes deverao explicar o problema e indicar como resolver.

O Portal Administrativo devera proteger o usuario contra erros operacionais, evitando publicacoes incompletas, exclusoes acidentais e configuracoes inseguras.

---

## 07 - Regras do Banco de Dados

O banco de dados devera preservar integridade, rastreabilidade e confiabilidade das informacoes da plataforma.

As regras permanentes para dados sao:

- Nunca apagar registros definitivamente como comportamento padrao.
- Sempre arquivar registros quando deixarem de ser exibidos.
- Sempre registrar historico de alteracoes relevantes.
- Sempre gerar logs de operacoes importantes.
- Sempre preservar integridade dos dados.

Exclusoes definitivas, quando existirem, deverao ser tratadas como operacoes excepcionais, protegidas por permissao especifica, confirmacao clara e registro de auditoria.

O banco devera ser estruturado para permitir crescimento, manutencao, backup, restauracao e auditoria.

Toda informacao critica devera possuir origem rastreavel, usuario responsavel e data de alteracao.

---

## 08 - Regras de SEO

O SEO devera ser tratado como parte essencial da publicacao de cada imovel e da presenca digital da consultoria.

Todo imovel devera possuir:

- Titulo.
- Meta Description.
- Slug.
- Canonical.
- Open Graph.
- Schema.
- Sitemap.
- Health Score.

O sistema devera gerar automaticamente informacoes de SEO sempre que possivel, permitindo revisao manual quando necessario.

Nenhum imovel devera ser publicado sem estrutura minima de SEO valida.

O SEO devera manter linguagem natural, profissional e coerente com a identidade da consultoria, evitando exageros, repeticoes artificiais ou informacoes enganosas.

---

## 09 - Seguranca

A plataforma devera adotar seguranca como regra permanente em todas as camadas.

As regras minimas de seguranca sao:

- Login obrigatorio para acesso administrativo.
- Controle de permissoes.
- Logs administrativos.
- Backups.
- Auditoria.

Toda acao administrativa relevante devera ser registrada, incluindo criacao, edicao, publicacao, exclusao, upload, alteracao de configuracoes e tentativas de acesso.

O acesso ao Portal Administrativo devera ser protegido por autenticacao segura, expiracao de sessao e controle de permissoes por perfil.

Dados sensiveis, backups, arquivos internos e configuracoes da plataforma nao deverao ficar expostos publicamente.

---

## 10 - Escalabilidade

A plataforma devera permitir crescimento sem perda de desempenho, organizacao ou qualidade operacional.

Toda arquitetura devera permanecer modular, permitindo evolucao gradual de funcionalidades, usuarios, imoveis, midia, integracoes e automacoes.

Novos modulos deverao seguir os mesmos padroes definidos neste documento.

O crescimento da plataforma nao devera comprometer:

- Velocidade.
- Clareza.
- Seguranca.
- Experiencia mobile.
- Organizacao administrativa.
- Qualidade visual.
- Confiabilidade dos dados.

A plataforma devera estar preparada para evoluir de uma operacao individual para uma equipe maior, preservando controle, auditoria e simplicidade de uso.

---

## 11 - Inteligencia Artificial

Toda automacao futura baseada em inteligencia artificial devera respeitar as normas deste documento.

A IA devera auxiliar o usuario, melhorar eficiencia operacional e reduzir tarefas repetitivas, sem substituir decisoes administrativas importantes.

Decisoes sensiveis, como publicacao, exclusao, alteracao critica de preco, restauracao de dados e configuracoes estruturais, deverao permanecer sob controle humano.

A IA devera atuar como apoio para sugestoes, revisoes, organizacao, melhoria de textos, SEO, classificacao, qualidade de cadastro e produtividade administrativa.

Qualquer recurso de IA devera preservar transparencia, seguranca, rastreabilidade e possibilidade de revisao pelo administrador.

---

## 12 - Revisoes

Este documento devera ser revisado apenas quando houver mudanca oficial relevante na visao normativa da plataforma.

Toda revisao devera registrar data, versao, responsavel e resumo da alteracao.

| Versao | Data | Responsavel | Resumo |
| ------ | ---- | ----------- | ------ |
| 1.0 | 2026-06-23 | Stephanie Campos | Criacao do documento normativo da plataforma. |

