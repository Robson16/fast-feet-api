# Backlog da FastFeet API

Este documento e o roteiro de implementacao auditado do repositorio. Os estados abaixo foram conferidos no codigo em 2026-11-03; uma story so deve ser marcada como concluida quando todos os passos e criterios de aceite estiverem atendidos e os testes relevantes passarem.

## Legenda e estado geral

- **Concluida**: implementacao, seguranca, documentacao e testes exigidos estao presentes.
- **Parcial**: ha implementacao util, mas faltam itens descritos na story ou ha uma falha comprovada.
- **Pendente**: nao ha implementacao funcional suficiente para considerar a story iniciada.
- `[x]` significa concluido e verificado; `[ ]` significa trabalho restante.

| Epic | Estado auditado |
| --- | --- |
| Epic 1: Autenticacao e usuarios | Parcial |
| Epic 2: Persistencia e destinos | Parcial |
| Epic 3: Gestao de pacotes | Parcial |
| Epic 4: Notificacoes | Pendente |
| Epic 5: Documentacao e verificacao | Parcial |
| Epic 6: Documentacao de desenvolvimento | Parcial |

### Linha de base verificada

- Ha endpoints HTTP para cadastro publico, autenticacao, gestao administrativa de usuarios, perfil, criacao de destinos e listagem de pacotes do destinatario.
- Os casos de uso de criar/consultar/editar/excluir destinos e criar/consultar/excluir/alterar status de pacotes existem em `src/domain/order/application/use-cases/`, mas a maioria nao esta ligada a controllers HTTP.
- Os adapters Prisma de usuarios, destinos e pacotes existem e estao registrados em `src/infra/database/database.module.ts`. Nao foram encontrados testes de integracao diretos desses repositorios.
- O esquema Prisma ja tem `Notification`, mas nao ha entidade, repositorio, caso de uso ou endpoint de notificacoes. Nao ha referencia a foto de entrega no modelo de pacote.
- `npm run typecheck`: passou.
- `npm run test:e2e`: passou, 15 arquivos e 44 testes (inclui a suíte do seed).
- `npm run test`: 26 arquivos passaram e 1 falhou (70/71 testes). `src/domain/user/application/use-cases/user-list.usecase.spec.ts` espera que `users[0]` fique sozinho na pagina 2, mas as datas de criacao podem empatar e a ordenacao nao define desempate; tornar o teste e a ordenacao deterministas faz parte do trabalho restante.
- O README ja contem a URL correta do repositorio, `npm run dev`, porta `3333` e Swagger em `/api`. O que esta desatualizado e a descricao do que esta implementado/planejado e a ausencia de instrucoes operacionais completas.

## Epic 1: Autenticacao e gestao de usuarios

Objetivo: permitir que cada usuario se autentique e so execute operacoes autorizadas para o proprio papel e identidade.

### Story 1.1: Impedir elevacao de privilegio no cadastro publico (P0)

**Estado: Concluida.** O controller publico ignora o papel enviado e fixa `DELIVERER`; a criacao com papeis privilegiados usa rota autenticada de administrador.

Arquivos verificados: `src/infra/http/controllers/account/account-register.controller.ts`, `src/infra/http/schemas/account-register.schema.ts`, `src/infra/http/controllers/user/user-create.controller.ts`, `src/infra/auth/roles.guard.ts`, `src/infra/http/controllers/account/account-register.controller.e2e-spec.ts`.

- [x] Manter o cadastro publico em `POST /accounts` sem aceitar papel do cliente e criar sempre `DELIVERER`.
- [x] Manter a criacao de qualquer papel em `POST /users`, protegida por `@Roles("ADMIN")`.
- [x] Manter testes E2E para tentativa publica de criar `ADMIN` e `RECIPIENT`, verificando o papel persistido.

Critério de aceite: os testes E2E demonstram que o corpo publico nao consegue criar papel diferente de `DELIVERER`, e um usuario sem token nao consegue usar `POST /users`.

### Story 1.2: Provisionar o primeiro administrador com seguranca (P1)

**Estado: Concluida.** `prisma/seed.ts` usa `APP_ADMIN_PASSWORD`, faz hash com bcrypt e nao recria um administrador existente. O README documenta o provisionamento local e `test/seed.e2e-spec.ts` valida hash, idempotencia e falha sem senha.

Arquivos verificados: `prisma/seed.ts`, `prisma.config.ts`, `package.json`, `.env.example`, `README.md`, `test/setup.e2e.ts` e `test/seed.e2e-spec.ts`.

- [x] Exigir `APP_ADMIN_PASSWORD` para criar o administrador inicial e nunca aceitar essa operacao em `POST /accounts`.
- [x] Fazer hash da senha antes de grava-la e encerrar sem alteracao se ja houver administrador.
- [x] Documentar no README como definir `APP_ADMIN_PASSWORD` localmente, executar `npm run prisma:seed`, confirmar o resultado e remover/rotacionar o segredo com seguranca.
- [x] Testar que o seed grava apenas hash, pode ser executado duas vezes sem duplicar/alterar o administrador e falha claramente quando nao ha senha configurada.
- [x] Executar esses testes somente contra banco descartavel de teste; o setup E2E recusa qualquer banco cujo nome nao termine em `-test`.

Critério de aceite: atendido. `npm run test:e2e -- test/seed.e2e-spec.ts` passou (3 testes) e `npm run typecheck` passou.

### Story 1.3: Autenticar usuario com CPF e senha (P1)

**Estado: Concluida.** `POST /auth` usa o caso de uso de autenticacao, retorna `access_token` e a configuracao JWT usa RS256.

Arquivos verificados: `src/infra/http/controllers/auth/authenticate.controller.ts`, `src/infra/auth/auth.module.ts`, `src/infra/auth/jwt.strategy.ts`, `src/infra/http/controllers/auth/authenticate.controller.e2e-spec.ts`.

- [x] Manter `POST /auth` publico e ligado a `UserAuthenticateUseCase`.
- [x] Manter assinatura/verificacao RS256 com as chaves configuradas no ambiente.
- [x] Manter resposta `{ "access_token": "..." }` e resposta `401` para CPF inexistente ou senha incorreta.

Critério de aceite: os tres cenarios E2E existentes passam e nenhum hash de senha e retornado.

### Story 1.4: Aplicar autorizacao por papel e propriedade (P1)

**Estado: Parcial.** A autenticacao JWT e `RolesGuard` globais existem; operacoes de usuario sao administrativas e `POST /destinations` e administrativo. As rotas de pacotes e destinos restantes ainda nao estao expostas/protegidas.

Arquivos existentes: `src/infra/auth/jwt-auth.guard.ts`, `src/infra/auth/roles.guard.ts`, `src/infra/auth/roles-decorator.ts`, controllers em `src/infra/http/controllers/`. Arquivos a completar: controllers de destino/pacote/notificacao descritos nos Epics 2–4 e seus E2E.

- [x] Manter autenticacao global; rotas publicas devem ser explicitamente identificadas com `@Public()`.
- [x] Manter `@Roles("ADMIN")` nas rotas administrativas de usuario e na criacao de destino existente.
- [x] Auditar as rotas HTTP existentes e registrar as lacunas nas Stories 1.5, 1.6, 1.7, 2.2 e 5.2.
- [ ] Antes de adicionar cada rota nova, definir se é pública ou autenticada, papel permitido e regra de propriedade; obter IDs do usuário autenticado via `@CurrentUser()`, nunca confiar em `userId`/`delivererId` arbitrário para acesso próprio.
- [ ] Verificar em cada rota administrativa se o papel autorizado continua válido no banco; não tratar o papel dentro de um JWT antigo como fonte definitiva (detalhado na Story 1.7).
- [ ] Restringir administracao de destinos a `ADMIN`; criacao/exclusao de pacotes a `ADMIN`; retirada e entrega a `DELIVERER` conforme Story 3.2.
- [ ] Restringir destinatarios a destinos, pacotes e notificacoes ligados ao proprio ID; restringir entregadores aos pacotes atribuidos a eles.
- [ ] Cobrir em E2E cada politica com sem token (`401`), papel incorreto (`403`) e tentativa de acessar ID alheio (sem vazamento de existencia/dados).

Critério de aceite: todas as rotas existentes e novas têm política explícita e teste para autenticação/papel/propriedade aplicável; nenhuma rota sensível depende apenas de o token ser válido.

### Story 1.5: Completar gestao de usuarios e operacoes de senha (P1)

**Estado: Parcial.** CRUD administrativo, perfil e rotas de troca/reset existem. A política mínima de 6 caracteres está aplicada aos quatro fluxos de senha e coberta nos limites; ainda faltam testes de segurança listados abaixo.

Arquivos existentes: `src/infra/http/controllers/user/`, `src/infra/http/controllers/profile/`, `src/domain/user/application/use-cases/user-change-password.usecase.ts.ts`, `src/domain/user/application/use-cases/user-reset-password.usecase.ts`, `src/infra/http/schemas/profile-change-password.schema.ts`, `src/infra/http/schemas/user-reset-password.schema.ts`, `src/infra/http/schemas/user-create.schema.ts`, `src/infra/http/schemas/account-register.schema.ts`, `src/infra/http/dtos/user-response.dto.ts`, `src/infra/http/presenters/user-presenter.ts`.

- [x] Manter `GET /users`, `GET /users/:id`, edicao/exclusao administrativa e `GET/PATCH/DELETE /profile` registrados em `HttpModule`.
- [x] Manter `PATCH /profile/password` vinculado ao ID do JWT e exigir senha atual antes de gravar hash novo.
- [x] Manter `PATCH /users/:id/password` exclusivo de `ADMIN`, com `404` para usuario inexistente e hash feito na camada de aplicacao.
- [x] Aplicar a política mínima de 6 caracteres em cadastro público, criação administrativa, troca própria e reset administrativo; verificar em E2E que 5 caracteres são rejeitados e exatamente 6 são aceitos.
- [x] Corrigir `userResetPasswordApiBody` em `src/infra/http/schemas/user-reset-password.schema.ts`: `required` declara `newPassword` e o schema OpenAPI documenta `minLength: 6`.
- [ ] Validar `:id` como UUID nas rotas `GET/PUT/DELETE /users/:id` e `PATCH /users/:id/password`; retornar `400` para formato inválido sem deixar erro de validação do Prisma virar `500`.
- [ ] Mapear usuário inexistente para `404` em `PUT /users/:id` e `DELETE /users/:id` (hoje ambos respondem `400`); documentar e testar também conflito de CPF/e-mail duplicado.
- [ ] Adicionar teste E2E explicito de que uma conta nao consegue trocar a senha de outra conta e de que nenhuma rota/resposta expoe `password`/hash.
- [ ] Revisar e documentar respostas `400`, `401`, `403` e `404` de cada rota de senha e manter Swagger alinhado aos schemas reais.

Critério de aceite: todos os endpoints aplicam a mesma regra de senha; nenhum retorno contem hash; testes cobrem usuario proprio, outro usuario, admin, nao-admin, payload invalido e alvo inexistente.

### Story 1.6: Listar pacotes do proprio usuario (P1)

**Estado: Parcial.** `GET /packets` lista somente pacotes de destinatario autenticado. Nao existe consulta HTTP equivalente para entregadores, embora a story abranja os dois papeis.

Arquivos existentes: `src/infra/http/controllers/packet/packet-list-by-recipient.controller.ts`, `src/domain/order/application/use-cases/packet-list-by-recipient.usecase.ts`, `src/domain/order/application/repositories/packets-repository.ts`, `src/infra/database/prisma/repositories/prisma-packets-repository.ts`, `src/infra/http/controllers/packet/packet-list-by-recipient.controller.e2e-spec.ts`.

- [x] Manter `GET /packets` para `RECIPIENT`, derivando `recipientId` de `@CurrentUser()` e paginando em paginas de 20.
- [x] Manter teste que confirma que um destinatario nao recebe pacotes de outro destinatario.
- [ ] Criar `src/domain/order/application/use-cases/packet-list-by-deliverer.usecase.ts`; buscar somente pacotes cujo `delivererId` seja o ID autenticado.
- [ ] Criar `src/infra/http/controllers/packet/packet-list-by-deliverer.controller.ts` e schema de paginacao; usar `@Roles("DELIVERER")` e nunca aceitar `delivererId` no query/body.
- [ ] Registrar controller e caso de uso em `src/infra/http/http.module.ts`.
- [ ] Criar `src/infra/http/controllers/packet/packet-list-by-deliverer.controller.e2e-spec.ts` cobrindo paginacao, sem token, papel incorreto e isolamento entre entregadores.
- [ ] Corrigir `src/infra/http/schemas/packet-list-by-recipient.schema.ts` para aceitar somente página inteira finita maior ou igual a 1; cobrir `page=0`, decimal, texto e valor ausente nos testes E2E.

Critério de aceite: destinatario e entregador veem apenas seus proprios pacotes, com paginacao validada e identidade sempre derivada do JWT.

### Story 1.7: Expirar e revalidar tokens de acesso (P1)

**Estado: Concluída.** O TTL é configurável em `JWT_ACCESS_TOKEN_TTL_SECONDS` (padrão de 900 segundos); a estratégia exige `exp`, confirma o usuário no banco e usa o papel atual. Tokens expirados, sem expiração ou de contas excluídas são rejeitados.

Arquivos verificados: `src/infra/auth/auth.module.ts`, `src/infra/auth/jwt.strategy.ts`, `src/infra/database/database.module.ts`, `src/infra/env/env.ts`, `.env.example`, `README.md`, `src/infra/http/controllers/auth/authenticate.controller.e2e-spec.ts`, `src/infra/http/controllers/profile/profile-get.controller.e2e-spec.ts` e `src/infra/http/controllers/user/user-list.controller.e2e-spec.ts`.

- [x] Definir um TTL finito para access tokens e aplicá-lo na assinatura JWT; documentar o valor e a configuração usada.
- [x] Na validação do bearer token, confirmar que o usuário de `sub` ainda existe e obter seu papel atual do banco; não autorizar usando somente `role` do payload.
- [x] Rejeitar tokens de usuários excluídos; se o papel mudou, usar o papel atual para a autorização (um token antigo de ADMIN não pode continuar tendo permissões de ADMIN).
- [x] Adicionar E2E para token sem expiração/expirado, usuário excluído e ADMIN rebaixado após emissão do token; confirmar `401` para identidade inválida e `403` quando a conta existe mas já não tem o papel exigido.
- [x] Confirmar que tokens de usuários válidos continuam funcionando em rotas sem papel específico e que login emite `exp`.

Critério de aceite: atendido. E2Es de perfil (4 testes), autenticação e lista de usuários (9 testes) e `npm run typecheck` passaram.

## Epic 2: Persistencia e destinos

Objetivo: concluir a camada de persistencia e tornar o cadastro/consulta/edicao de enderecos utilizavel por HTTP com politica de propriedade segura.

### Story 2.1: Validar repositorios Prisma de destinos e pacotes (P1)

**Estado: Parcial.** `PrismaDestinationsRepository` e `PrismaPacketsRepository` existem, tem mappers e estao registrados. Nao ha testes de integracao diretos; ha um defeito observavel: filtro apenas por estado e ignorado no filtro de pacotes.

Arquivos existentes: `src/infra/database/prisma/repositories/prisma-destinations-repository.ts`, `src/infra/database/prisma/repositories/prisma-packets-repository.ts`, `src/infra/database/prisma/mappers/prisma-destination-mapper.ts`, `src/infra/database/prisma/mappers/prisma-packet-mapper.ts`, `src/infra/database/prisma/mappers/prisma-packet-details-mapper.ts`, `src/infra/database/database.module.ts`. Arquivos de teste a criar: `src/infra/database/prisma/repositories/prisma-destinations-repository.e2e-spec.ts` e `src/infra/database/prisma/repositories/prisma-packets-repository.e2e-spec.ts`.

- [x] Manter os adapters e bindings/exportacoes atuais no `DatabaseModule`.
- [ ] Em `prisma-packets-repository.ts`, fazer a construcao do filtro de endereco considerar `state` mesmo quando `city` e `neighborhood` nao foram informados; padronizar comparacao de cidade/estado como case-insensitive.
- [ ] Criar testes de integracao usando a base `-test` e o setup de `vitest.config.e2e.mts`; nao usar mocks para afirmar comportamento Prisma.
- [ ] Testar em destinos: criar, buscar por ID, atualizar, excluir e comportamento para IDs inexistentes.
- [ ] Testar em pacotes: criar, buscar por ID/detalhes/aguardando, buscar por destinatario/status/entregador, filtros cidade/estado/bairro, proximidade, paginacao, atualizar e excluir; verificar relacoes e mapeamento decimal de latitude/longitude.
- [ ] Acrescentar caso de filtro somente `state`, paginacao vazia/limite e pacotes sem entregador para evitar regressoes.

Critério de aceite: os dois arquivos de integracao passam com PostgreSQL de teste; cada metodo das interfaces tem ao menos um cenario de sucesso e um de ausencia/filtro relevante.

### Story 2.2: Expor CRUD e listagem paginada de destinos (P1)

**Estado: Parcial.** Existe apenas `POST /destinations`; os casos de uso de busca, edicao e exclusao existem, mas nao estao registrados em `HttpModule`. Nao ha listagem paginada.

Arquivos existentes: `src/infra/http/controllers/destination/destination-create.controller.ts`, `src/infra/http/schemas/destination-create.schema.ts`, `src/domain/order/application/use-cases/destination-create.usecase.ts`, `destination-get.usecase.ts`, `destination-edit.usecase.ts`, `destination-delete.usecase.ts`, `src/domain/order/application/repositories/destinations-repository.ts`, `src/infra/database/prisma/repositories/prisma-destinations-repository.ts`. Criar controllers/schema/tests no mesmo diretorio `src/infra/http/controllers/destination/` e `src/infra/http/schemas/`.

- [x] Manter `POST /destinations` administrativo e conectado ao caso de uso de criacao.
- [ ] Corrigir o controller de criacao para converter destinatario inexistente em `404` em vez de responder `400` generico.
- [ ] Criar `GET /destinations/:id`, `PATCH /destinations/:id` e `DELETE /destinations/:id`, usando os casos de uso existentes; registrar os controllers e providers em `src/infra/http/http.module.ts`.
- [ ] Criar `DestinationListUseCase`, adicionar `findMany` a `DestinationsRepository` e implementar paginacao em `PrismaDestinationsRepository`; expor `GET /destinations?page=1` somente para ADMIN.
- [ ] Validar UUIDs, campos obrigatórios não vazios, ZIP/CEP conforme formato escolhido e latitude entre -90 e 90 / longitude entre -180 e 180; no caso de uso, confirmar que o usuário vinculado existe e tem papel `RECIPIENT` (hoje só é verificada a existência).
- [ ] Mapear destinatário inexistente para `404`, papel de destinatário inválido para `400` (ou `422`, se esse for o padrão definido) e testar ambos; não responder `400` sem mensagem para qualquer erro do caso de uso.
- [ ] Criar presenter/DTO se necessario para nao retornar dados internos e manter formato de resposta consistente nas rotas.
- [ ] Criar E2E por rota cobrindo sucesso, payload invalido, destinatario/destino inexistente, `401`, `403` e paginacao; documentar todos os casos no Swagger.

Critério de aceite: ADMIN consegue criar, listar, consultar, editar e excluir destino; demais papeis nao administram enderecos; entradas e respostas estao documentadas e testadas.

## Epic 3: Gestao de pacotes

Objetivo: expor o ciclo de vida do pacote com transicoes validas, isolamento entre entregadores/destinatarios e consultas uteis.

### Story 3.1: Expor criacao, consulta e exclusao de pacotes (P1)

**Estado: Parcial.** Os casos de uso `PacketCreateUseCase`, `PacketGetUseCase` e `PacketDeleteUseCase` existem, mas nao ha controllers correspondentes registrados. `PacketPresenter` ja existe.

Arquivos existentes: `src/domain/order/application/use-cases/packet-create.usecase.ts`, `packet-get.usecase.ts`, `packet-delete.usecase.ts`, `src/infra/http/presenters/packet-presenter.ts`, `src/infra/http/http.module.ts`. Criar `src/infra/http/controllers/packet/packet-create.controller.ts`, `packet-get.controller.ts`, `packet-delete.controller.ts`, schemas em `src/infra/http/schemas/` e respectivos `*.e2e-spec.ts`.

- [ ] Criar `POST /packets` para ADMIN, validando UUID e existencia de `destinationId`; o status inicial deve ser `AWAITING_WITHDRAWAL` e nao deve ser escolhido pelo cliente.
- [ ] Criar `GET /packets/:id`; ADMIN pode consultar qualquer pacote, RECIPIENT so pode consultar pacote ligado ao seu destino, e DELIVERER so pacote atribuido a ele.
- [ ] Criar `DELETE /packets/:id` para ADMIN; retornar `404` se ausente e mapear conflito de relacao sem expor erro interno do Prisma.
- [ ] Registrar casos de uso/controllers em `src/infra/http/http.module.ts` e aplicar presenter para formatar IDs/status.
- [ ] Documentar contrato, papeis, codigos HTTP e erros no Swagger.
- [ ] Criar E2E para sucesso, destino invalido, pacote inexistente, papel proibido e consulta cruzada entre destinatarios/entregadores.

Critério de aceite: criar/consultar/excluir e possivel por HTTP com autorizacao por papel e propriedade; nenhuma resposta vaza relacoes ou erros internos.

### Story 3.2: Expor transicoes de status com autorizacao (P1)

**Estado: Parcial.** Os quatro casos de uso de transicao existem e tem testes unitarios, mas nao ha endpoints HTTP. O caso de retirada verifica existencia do usuario, nao que ele seja entregador; retorno/reabertura tambem precisam de politica de ator definida e aplicada.

Arquivos existentes: `src/domain/order/application/use-cases/packet-update-status-to-awaiting-withdrawal.usecase.ts`, `packet-update-status-to-withdrawn.usecase.ts`, `packet-update-status-to-returned.usecase.ts`, `packet-update-status-to-delivered.usecase.ts` e specs correspondentes. Criar controllers/schemas/E2E em `src/infra/http/controllers/packet/` e `src/infra/http/schemas/`.

- [ ] Usar esta matriz de autorizacao: `DELIVERER` pode retirar pacote em espera e entregar somente pacote retirado por ele; somente `ADMIN` pode marcar retorno e reabrir pacote para `AWAITING_WITHDRAWAL`.
- [ ] Criar `POST /packets/:id/withdrawal`, `POST /packets/:id/delivered`, `POST /packets/:id/returned` e `POST /packets/:id/awaiting-withdrawal`; acoes de entregador devem obter o ID exclusivamente do JWT.
- [ ] Revalidar papel do usuario no caso de uso de retirada; nao basta que exista um usuario com aquele ID.
- [ ] Em retorno e reabertura, aplicar validacao de estado anterior e impedir transicoes repetidas/ilegais; manter remocao do `delivererId` quando o pacote volta a ficar sem atribuicao.
- [ ] Fazer a entrega exigir o comprovante da Story 3.4 antes de persistir `DELIVERED`.
- [ ] Registrar todos os casos de uso/controllers no modulo HTTP; mapear `ResourceNotFoundError`, pacote indisponivel e estado invalido para `404`, `409` ou `403` conforme causa.
- [ ] Adicionar E2E para as quatro transicoes: sucesso, pacote inexistente, pacote indisponivel, papel proibido, entregador incorreto, estado invalido, repeticao e ausencia de foto.

Critério de aceite: somente transicoes da matriz sao persistidas; identidade do entregador nao vem do request; notificacoes/foto sao tratadas pelas stories proprias antes de concluir as transicoes dependentes.

### Story 3.3: Completar busca, filtros e listagens de pacotes (P1)

**Estado: Parcial.** Ha casos de uso/repositorio para aguardando, entregues/retirados por entregador, proximidade, destinatario e status generico; so a listagem do destinatario esta exposta. Nao ha consulta de retornados por caso de uso/rota.

Arquivos existentes: `src/domain/order/application/repositories/packets-repository.ts`, `src/domain/order/application/use-cases/packet-fetch-awaiting.usecase.ts`, `packet-fetch-delivered-by-deliverer.usecase.ts`, `packet-fetch-withdrawn-by-deliverer.usecase.ts`, `packet-fetch-nearby-by-deliverer.usecase.ts`, `packet-list-by-recipient.usecase.ts`, `src/infra/database/prisma/repositories/prisma-packets-repository.ts`. Criar controllers/query schemas/E2E em `src/infra/http/controllers/packet/` e `src/infra/http/schemas/`.

- [ ] Preservar `GET /packets` para lista propria de RECIPIENT; criar `GET /packets/awaiting` para ADMIN/DELIVERER, `GET /deliverer/packets` para lista propria de DELIVERER e `GET /packets/returned` para ADMIN.
- [ ] Para ADMIN, permitir busca operacional por `status` e `delivererId` em rota administrativa separada; para DELIVERER, sempre derivar `delivererId` do JWT e ignorar/rejeitar ID arbitrario.
- [ ] Criar `PacketFetchReturnedUseCase` ou usar explicitamente a consulta generica por status, documentando uma unica fonte de comportamento para retornados.
- [ ] Aceitar filtros `neighborhood`, `city`, `state`, `page`; aceitar `latitude`, `longitude` e `distance` somente na busca de proximidade. Validar valores e impedir combinacao ambigua de filtros.
- [ ] Corrigir o filtro somente por `state` e alinhar normalizacao/case-insensitivity; manter todas as consultas paginadas em paginas de 20 com ordenacao estavel.
- [ ] Registrar providers/controllers no modulo HTTP, documentar query params e adicionar testes de filtros isolados/combinados, bordas de paginacao, lista vazia e isolamento por entregador.

Critério de aceite: resultados e contagem da pagina refletem todos os filtros; entregador nunca consulta pacotes atribuidos a outro; ADMIN pode consultar status/entregador conforme contrato.

### Story 3.4: Exigir comprovante fotografico de entrega (P1)

**Estado: Pendente.** O modelo e o fluxo HTTP atuais nao armazenam comprovante.

Arquivos a criar/alterar: `prisma/schema.prisma`, nova migration em `prisma/migrations/`, `src/domain/order/enterprise/entities/packet.ts` ou entidade de comprovante, mapper Prisma de pacote, caso de uso de entrega, modulo de storage em `src/infra/`, schema de upload e controller de entrega.

- [ ] Armazenar a imagem em bucket privado compativel com S3; nao gravar binario no PostgreSQL nem aceitar URL publica arbitraria. Configurar bucket/credenciais por variaveis de ambiente documentadas em `.env.example`.
- [ ] Persistir no banco apenas a chave do objeto e metadados necessarios (tipo MIME, tamanho, data); adicionar migration e atualizar mapper.
- [ ] Definir upload como multipart com limite de tamanho explicito e aceitar somente formatos de imagem permitidos, validando conteudo real alem da extensao/MIME declarado.
- [ ] Gerar acesso de leitura temporario/autorizado; nao retornar credenciais nem URL permanente publica.
- [ ] Alterar a transicao para `DELIVERED` para exigir upload valido antes da gravacao do status; remover objeto se a transacao nao for concluida ou documentar estrategia de compensacao.
- [ ] Testar upload valido, formato/tamanho invalido, comprovante ausente, falha no storage, falha no banco e acesso ao comprovante por usuario sem autorizacao.

Critério de aceite: nao existe pacote `DELIVERED` sem comprovante persistido; leitura do comprovante e privada e os testes cobrem falha parcial entre storage e banco.

## Epic 4: Notificacoes

Objetivo: registrar e entregar ao destinatario um evento confiavel por alteracao de status, com leitura isolada por identidade.

### Story 4.1: Criar notificacao em cada transicao de pacote (P1)

**Estado: Pendente.** Existe somente o modelo Prisma `Notification`; nao ha logica de dominio/aplicacao nem persistencia da entidade.

Arquivos a criar/alterar: entidade e value objects em `src/domain/notification/enterprise/`, contratos/use cases em `src/domain/notification/application/`, adapter/mapper em `src/infra/database/prisma/`, `src/infra/database/database.module.ts`, `prisma/schema.prisma` e migration se for adicionada chave de idempotencia.

- [ ] Definir o conteudo da notificacao por status (titulo, texto, pacote, destinatario e data) e criar entidade/use case/repositorio sem acoplar dominio ao Prisma.
- [ ] Resolver o destinatario pelo destino do pacote; nao confiar em `recipientId` enviado pelo cliente.
- [ ] Persistir mudanca de status e notificacao na mesma transacao PostgreSQL, para que ambas sejam gravadas ou nenhuma seja gravada.
- [ ] Tornar a operacao repetivel: receber/propagar chave de idempotencia da transicao e impor unicidade no banco; uma repeticao da mesma solicitacao nao pode criar segunda notificacao.
- [ ] Registrar `NotificationRepository` no `DatabaseModule` e criar testes unitarios e de integracao para cada status e falhas/retentativas.

Critério de aceite: toda transicao concluida produz exatamente uma notificacao para o destinatario; falha na criacao da notificacao tambem impede que a transicao seja considerada concluida.

### Story 4.2: Listar notificacoes e marcar como lidas (P2)

**Estado: Pendente.** Nao existem endpoints nem caso de uso de leitura.

Arquivos a criar: use cases/repository de consulta e leitura em `src/domain/notification/application/`, controllers/schemas/E2E em `src/infra/http/controllers/notification/` e `src/infra/http/schemas/`; registrar em `src/infra/http/http.module.ts`.

- [ ] Criar `GET /notifications?page=1` para `RECIPIENT`, derivando o destinatario do JWT e retornando mais recentes primeiro, 20 por pagina.
- [ ] Criar `PATCH /notifications/:id/read`; alterar `readAt` somente se a notificacao pertencer ao usuario autenticado; definir resposta idempotente para item ja lido.
- [ ] Retornar `404` para notificacao ausente ou pertencente a outro destinatario, sem revelar propriedade alheia.
- [ ] Criar E2E para pagina vazia, nao lida/lida, repeticao, usuario sem papel RECIPIENT, sem token e tentativa de acesso cruzado; documentar Swagger.

Critério de aceite: um destinatario lista e altera apenas as proprias notificacoes; paginacao e estado de leitura sao persistidos e testados.

## Epic 5: Documentacao e verificacao da API

Objetivo: garantir que OpenAPI descreve exatamente a API e que os comandos de verificacao dao um sinal confiavel de regressao.

### Story 5.1: Completar e verificar Swagger/OpenAPI (P1)

**Estado: Parcial.** Swagger esta ativado em `/api`; rotas atuais tem decorators, mas falta validar o documento gerado e corrigir descricoes/schemas inconsistentes. Novas rotas ainda precisam ser documentadas junto com sua implementacao.

Arquivos existentes: `src/infra/main.ts`, controllers em `src/infra/http/controllers/`, DTOs em `src/infra/http/dtos/`, schemas em `src/infra/http/schemas/`. Criar teste em `src/infra/main.e2e-spec.ts` ou `test/swagger.e2e-spec.ts`.

- [x] Manter titulo/versao, autenticacao Bearer e interface Swagger em `/api`.
- [x] Manter documentacao existente de `GET /users`, `GET /users/:id`, `GET /profile` e do tipo de status/papeis.
- [ ] Corrigir campos e codigos documentados divergentes, comecando por `newPassword` no schema Swagger de reset.
- [ ] Para cada rota ja implementada, documentar request/query, resposta e DTO, autenticacao, papel permitido e erros `400/401/403/404/409` aplicaveis.
- [ ] Documentar novas rotas na mesma story/PR em que forem criadas; nao deixar endpoint publicado sem schema OpenAPI.
- [ ] Adicionar teste que consulta `/api-json` (ou documento gerado em teste) e verifica rotas essenciais, schemas, Bearer auth e ausencia de propriedades secretas.

Critério de aceite: teste de contrato confirma que o documento OpenAPI corresponde as rotas e payloads; Swagger UI carrega em `/api`.

### Story 5.2: Completar E2E e estabilizar verificacoes (P1)

**Estado: Parcial.** Ha 15 arquivos E2E e 44 testes passando no momento da auditoria, mas cobrem apenas cadastro/autenticacao, alguns fluxos de usuarios, criacao de destino, listagem de pacotes do destinatario e seed. A suite unitaria tem uma falha conhecida.

Arquivos existentes: testes `*.e2e-spec.ts` sob `src/infra/http/controllers/`, `test/setup.e2e.ts`, `vitest.config.e2e.mts`, `vitest.config.mts`. Arquivo com falha observada: `src/domain/user/application/use-cases/user-list.usecase.spec.ts`; implementacao relacionada: `src/infra/database/prisma/repositories/prisma-users-repository.ts`.

- [ ] Corrigir a ordenacao/paginacao de usuarios para ter desempate estavel (por exemplo, `createdAt` e `id`) e atualizar o repositorio in-memory para seguir o mesmo contrato; nao relaxar a assercao para mascarar resultado nao deterministico.
- [ ] Criar/expandir E2E para todas as rotas de destino, pacote e notificacoes das Stories 2–4, cobrindo sucesso, validacao, `404`, conflito/estado invalido, `401`, `403` e isolamento de propriedade.
- [ ] Completar testes E2E de senha e perfil: identidade do JWT, ausencia de hashes, troca propria, reset ADMIN e payload invalido.
- [ ] Adicionar E2E sem token para `GET /profile` e `DELETE /profile`, e para `PATCH /users/:id/password`; testar token de papel incorreto onde houver política de papel.
- [ ] Adicionar E2E para usuário inexistente e UUID inválido em `GET/PUT/DELETE /users/:id` e `PATCH /users/:id/password`; confirmar códigos `404` e `400` definidos na Story 1.5.
- [ ] Cobrir em E2E as regras corrigidas da criação de destinos: ID de usuário existente que não é `RECIPIENT`, destinatário inexistente e coordenadas fora dos limites.
- [ ] Cobrir em E2E paginação de pacotes com decimal, texto, zero e página válida, além da página padrão.
- [ ] Cobrir emissão/validade do token, papel alterado e usuário excluído conforme Story 1.7.
- [x] Manter `test/setup.e2e.ts` exigindo banco com nome terminado em `-test`, aplicando migrations e limpando tabelas antes de cada teste.
- [ ] Garantir determinismo em factories/dados de teste e nao depender de ordem criada no mesmo milissegundo ou de dados compartilhados.
- [ ] Antes de concluir cada Epic, executar `npm run typecheck`, `npm run test` e `npm run test:e2e`; registrar falhas ambientais separadamente de falhas de produto.

Critério de aceite: os tres comandos passam em ambiente configurado; todas as rotas implementadas tem cobertura dos caminhos de autorizacao e erros relevantes; testes E2E nao tocam banco que nao termine em `-test`.

## Epic 6: Documentacao para desenvolvimento

Objetivo: permitir que alguem clone, configure, migre, execute e teste o projeto seguindo apenas o README e `.env.example`.

### Story 6.1: Alinhar README com o estado real e documentar setup (P2)

**Estado: Parcial.** Clone, `npm run dev`, porta `3333`, `/api` e provisionamento do ADMIN com seed ja estao documentados. O README ainda descreve CRUD de pacote/destino como implementado e tambem lista features ja disponiveis como planejadas; faltam instrucoes completas de variaveis/chaves JWT e configuracao do banco E2E.

Arquivos a alterar: `README.md`, `.env.example`; conferir consistencia com `package.json`, `prisma.config.ts`, `vitest.config.e2e.mts` e `test/setup.e2e.ts`.

- [x] Manter URL `https://github.com/Robson16/fast-feet-api.git`, comando `npm run dev`, porta `3333` e Swagger `http://localhost:3333/api`.
- [ ] Reescrever as listas “Implemented Features” e “Planned Features” conforme os endpoints realmente expostos; remover duplicacao de requisito de foto e nao chamar casos de uso sem rota HTTP de feature disponivel.
- [ ] Documentar Node.js `>=20.10.0`, instalacao, copia/preenchimento de variaveis do `.env.example`, geracao/configuracao das chaves JWT RS256 e conexao PostgreSQL.
- [ ] Documentar comandos atuais: `docker-compose up -d`, `npm run prisma:migrate`, `npm run prisma:seed`, `npm run dev`, `npm run typecheck`, `npm run test` e `npm run test:e2e`.
- [ ] Explicar que E2E requer `.env.test.local` apontando para banco dedicado com nome terminado em `-test`; explicar como criar/migrar esse banco sem apontar para dados reais.
- [x] Documentar provisionamento do primeiro ADMIN com `APP_ADMIN_PASSWORD`, comportamento idempotente do seed e cuidados para nao versionar segredo.
- [ ] Atualizar a secao de regras de negocio com a matriz de papeis definida nas Stories 1.4 e 3.2; manter README e Swagger consistentes.

Critério de aceite: uma pessoa sem contexto previo consegue iniciar API, migrations, admin inicial e suites de teste seguindo os passos publicados, e a lista de features nao promete rotas inexistentes.
