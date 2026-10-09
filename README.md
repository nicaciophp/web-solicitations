# Central de Solicitações

Sistema para centralizar as solicitações dos funcionários de uma empresa: abertura, acompanhamento, aprovação/rejeição e um dashboard com indicadores. A prioridade de cada solicitação pode ser classificada automaticamente por IA (Ollama) quando não é informada manualmente.

- **Backend:** NestJS + TypeORM + PostgreSQL
- **Frontend:** Next.js (App Router)
- **Autenticação:** JWT, com perfis `admin` e `employee`
- **Infra:** Docker Compose (Postgres, backend, frontend, Ollama e Mailpit)

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (inclui o Docker Compose v2)
- Portas livres na sua máquina: `3000`, `3001`, `5432`, `8025`, `1025` e `11434`

Não é necessário instalar Node, PostgreSQL ou qualquer outra dependência na máquina: tudo roda dentro dos containers.

## Configuração

1. Copie o arquivo de exemplo de variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

2. Edite o `.env` e ajuste pelo menos:

   | Variável | Para que serve |
   |---|---|
   | `JWT_SECRET` | Chave usada para assinar os tokens de login. Gere um valor aleatório, por exemplo com `openssl rand -hex 32`. |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Credenciais do usuário administrador, criado automaticamente na primeira vez que o backend sobe (seed). |
   | `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credenciais do banco. Os valores padrão funcionam para desenvolvimento local. |
   | `POSTGRES_PORT` / `BACKEND_PORT` / `FRONTEND_PORT` | Portas expostas no host. Mude se alguma já estiver em uso na sua máquina. |

   O `.env` não é versionado (está no `.gitignore`).

## Como rodar

Na raiz do projeto:

```bash
docker compose up -d --build
```

Isso sobe cinco serviços: `postgres`, `backend`, `frontend`, `ollama` e `mailpit`. Na primeira execução, o backend cria automaticamente o usuário admin com as credenciais do `.env`.

Para a classificação automática de prioridade por IA funcionar, baixe o modelo no container do Ollama (só precisa fazer isso uma vez; o modelo fica salvo num volume):

```bash
docker compose exec ollama ollama pull llama3.2:3b
```

Sem o modelo baixado, a aplicação continua funcionando normalmente — toda solicitação criada sem prioridade informada simplesmente recebe `baixa` como padrão.

### Acessando a aplicação

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API (Swagger) | http://localhost:3001/docs |
| Caixa de emails de teste (Mailpit) | http://localhost:8025 |

Ao abrir o frontend pela primeira vez, você é redirecionado para a tela de login. Entre com o `ADMIN_EMAIL`/`ADMIN_PASSWORD` definidos no `.env`. A partir daí, o admin cadastra setores e funcionários pela própria interface (menu **Setores** e **Funcionários**); cada funcionário recebe um e-mail e senha próprios para logar.

### Parando os serviços

```bash
docker compose down
```

Os dados do Postgres e o modelo do Ollama ficam guardados em volumes Docker e sobrevivem a esse comando. Para apagar tudo, incluindo os volumes:

```bash
docker compose down -v
```

## Perfis e permissões

| Ação | Admin | Funcionário |
|---|---|---|
| Login | sim | sim |
| Criar solicitação | não | sim (sempre para si mesmo) |
| Listar/ver solicitações | todas | só as próprias |
| Editar título e descrição | sim | sim (só nas próprias) |
| Aprovar/rejeitar (com comentário) | sim | não |
| Excluir solicitação | sim | não |
| Dashboard | geral | só das próprias |
| Cadastrar setores, funcionários e usuários | sim | não |

## Desenvolvimento

Os containers `backend` e `frontend` rodam em modo watch (hot-reload), com o código montado como volume — qualquer alteração nos arquivos locais é refletida automaticamente, sem precisar reiniciar o container.

**Se você instalar uma dependência nova** (`npm install` dentro de `backend/` ou `frontend/`), é preciso reconstruir a imagem para o `node_modules` do container ser atualizado:

```bash
docker compose up -d --build --renew-anon-volumes backend
# ou
docker compose up -d --build --renew-anon-volumes frontend
```

### Comandos úteis

```bash
# Ver logs em tempo real
docker compose logs -f backend
docker compose logs -f frontend

# Só avisos e erros do backend (logs estruturados em JSON)
docker compose logs -f backend | grep -E '"level":"(warn|error)"'

# Entrar no terminal de um container
docker compose exec backend sh

# Rodar o Nest CLI (gerar módulo, controller, etc.)
docker compose exec backend npx nest generate module modules/exemplo

# Rodar os testes do backend
docker compose exec backend npm test
```

## Estrutura do projeto

```
web-solicitations/
├── backend/        # API NestJS
│   └── src/
│       ├── common/         # guards, decorators, logger estruturado
│       └── modules/
│           ├── auth/           # login, JWT
│           ├── users/          # usuários (login, perfil)
│           ├── employees/      # funcionários
│           ├── sectors/        # setores
│           ├── solicitations/  # solicitações, dashboard, classificador de prioridade (IA)
│           └── notifications/  # e-mails de abertura e decisão
├── frontend/       # Next.js (App Router)
│   └── src/
│       ├── app/             # rotas (login, dashboard, solicitações, funcionários, setores)
│       ├── features/        # lógica e telas por área
│       ├── components/ui/   # componentes reutilizáveis
│       └── lib/             # cliente de API, sessão
├── docker-compose.yml
└── .env.example
```

## Observabilidade

O backend grava logs estruturados em JSON (uma linha por evento): consultas ao banco em nível `debug`, criação/edição de registros em `info`, e falhas de regra de negócio ou de banco em `warn`/`error`. Veja com `docker compose logs -f backend`.
