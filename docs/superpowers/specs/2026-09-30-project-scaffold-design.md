# Scaffold inicial: Sistema de centralização de solicitações

## Contexto

Novo projeto para centralizar solicitações de usuários. Backend em NestJS,
frontend em Next.js, banco de dados Postgres, tudo rodando via Docker. Este
spec cobre apenas o **estrutural** necessário para iniciar o projeto — rotas
de negócio e autenticação serão desenvolvidas depois, pelo usuário.

## Escopo

### Estrutura do repositório (monorepo simples)

```
web-solicitations/
├── backend/          # NestJS
├── frontend/         # Next.js
├── docker-compose.yml
└── .env
```

Backend e frontend são projetos independentes (cada um com seu próprio
`package.json`), sem workspaces compartilhados.

### Backend (NestJS)

- Projeto gerado via Nest CLI padrão (`AppModule`, `main.ts`).
- `@nestjs/config` com `ConfigModule.forRoot()` para variáveis de ambiente.
- `@nestjs/typeorm` configurado para conectar ao Postgres via variáveis de
  ambiente (host, porta, usuário, senha, nome do banco).
- `HealthModule` mínimo com rota `GET /health`, usado apenas como sanity
  check de que API, banco e Docker estão funcionando — não é uma feature de
  negócio.
- `Dockerfile.dev`: hot-reload via `start:dev` (ts-node/nodemon do Nest CLI),
  código montado como volume.
- Sem Dockerfile de produção por enquanto (fora de escopo).
- Pacotes gerenciados via npm.

### Frontend (Next.js)

- Scaffold padrão via `create-next-app` (TypeScript, App Router).
- `Dockerfile.dev` com hot-reload (`next dev`), código montado como volume.
- Nenhuma lógica além do boilerplate padrão.

### Infraestrutura (docker-compose.yml)

Três serviços:

- `postgres`: imagem oficial `postgres`, volume nomeado para persistência de
  dados, variáveis via `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`,
  `POSTGRES_DB`), porta exposta (ex. 5432).
- `backend`: build a partir de `backend/Dockerfile.dev`, depende do serviço
  `postgres` (`depends_on`), porta exposta (ex. 3001), variáveis de conexão
  ao banco injetadas via `.env`.
- `frontend`: build a partir de `frontend/Dockerfile.dev`, porta exposta
  (ex. 3000).

Um único `.env` na raiz do projeto concentra as variáveis compartilhadas
entre os serviços (credenciais do Postgres, host/porta usados pelo backend).

## Fora de escopo

- Autenticação e autorização.
- Rotas e lógica de negócio (serão criadas pelo usuário).
- Testes automatizados.
- CI/CD.
- Dockerfile de produção / build otimizado.
- Compartilhamento de tipos/DTOs entre backend e frontend.

## Critério de sucesso

- `docker compose up` sobe os três serviços sem erro.
- Backend consegue se conectar ao Postgres (validável via log de boot do
  TypeORM e/ou pela rota `GET /health`).
- Frontend acessível em `http://localhost:3000` com a página padrão do
  Next.js.
- Editar um arquivo do backend ou do frontend reflete a mudança sem precisar
  rebuildar a imagem Docker (hot-reload funcionando).
