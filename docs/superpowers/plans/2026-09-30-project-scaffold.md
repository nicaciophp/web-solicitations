# Project Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a monorepo with a NestJS backend (TypeORM + Postgres) and a Next.js frontend, both running via Docker Compose with hot-reload, with no business routes yet.

**Architecture:** `backend/` (NestJS, TypeORM, `@nestjs/config`) and `frontend/` (Next.js App Router) as two independent npm projects at the repo root, each with its own `Dockerfile.dev`. A root `docker-compose.yml` orchestrates three services — `postgres`, `backend`, `frontend` — wired together via a root `.env` file.

**Tech Stack:** NestJS 10+, TypeORM, `pg`, `@nestjs/config`, Next.js (TypeScript, App Router), Postgres 16, Docker Compose, npm.

## Global Constraints

- Package manager: npm (not pnpm/yarn).
- No workspaces — `backend/` and `frontend/` are independent npm projects.
- No business routes, auth, tests, CI/CD, or production Dockerfiles — structural scaffold only.
- Docker dev images must support hot-reload via mounted volumes.
- Node version for both Docker images: `node:20-alpine` (matches local Node v20).
- Postgres image: `postgres:16-alpine`.
- Backend container port: 3001. Frontend container port: 3000. Postgres container port: 5432.

---

### Task 1: Scaffold NestJS backend project

**Files:**
- Create: `backend/` (entire Nest CLI output: `package.json`, `tsconfig.json`, `src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`, etc.)

**Interfaces:**
- Produces: a runnable Nest project at `backend/` with `npm run start:dev` script, listening on port 3000 by default (changed in Task 2).

- [ ] **Step 1: Generate the Nest project**

Run from the repo root:

```bash
npx -y @nestjs/cli@10 new backend --package-manager npm --skip-git --language TS
```

Expected: command completes, `backend/` directory exists with `package.json`, `src/main.ts`, `src/app.module.ts`.

- [ ] **Step 2: Verify it boots locally**

```bash
cd backend && npm run start:dev
```

Expected: console shows `Nest application successfully started`, listening on port 3000. Stop it with Ctrl+C once confirmed.

- [ ] **Step 3: Install TypeORM/config/Postgres driver dependencies**

```bash
cd backend && npm install @nestjs/config @nestjs/typeorm typeorm pg
```

Expected: `backend/package.json` dependencies now include `@nestjs/config`, `@nestjs/typeorm`, `typeorm`, `pg`.

- [ ] **Step 4: Commit**

```bash
git add backend
git commit -m "feat(backend): scaffold NestJS project with TypeORM dependencies"
```

---

### Task 2: Wire ConfigModule + TypeORM into AppModule

**Files:**
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/main.ts`

**Interfaces:**
- Consumes: env vars `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT` (defined in Task 7's `.env`, injected by Docker Compose).
- Produces: `AppModule` with `TypeOrmModule` registered globally, available for feature modules via `TypeOrmModule.forFeature()`. App listens on `process.env.PORT` (fallback 3001).

- [ ] **Step 1: Update `backend/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 2: Update `backend/src/main.ts` to listen on `PORT`**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

- [ ] **Step 3: Verify it still compiles**

```bash
cd backend && npm run build
```

Expected: `nest build` completes with no TypeScript errors (exit code 0). Note: it will not successfully *connect* to Postgres yet since no DB env vars are set locally — that's expected and verified later in Task 8.

- [ ] **Step 4: Commit**

```bash
git add backend/src/app.module.ts backend/src/main.ts
git commit -m "feat(backend): wire ConfigModule and TypeORM into AppModule"
```

---

### Task 3: Add health check module

**Files:**
- Create: `backend/src/health/health.module.ts`
- Create: `backend/src/health/health.controller.ts`
- Modify: `backend/src/app.module.ts`

**Interfaces:**
- Consumes: `DataSource` from `typeorm` (provided by `TypeOrmModule.forRoot()` in Task 2).
- Produces: `GET /health` → `{ status: 'ok', database: 'connected' | 'disconnected' }`.

- [ ] **Step 1: Create `backend/src/health/health.controller.ts`**

```typescript
import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  check() {
    return {
      status: 'ok',
      database: this.dataSource.isInitialized ? 'connected' : 'disconnected',
    };
  }
}
```

- [ ] **Step 2: Create `backend/src/health/health.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

- [ ] **Step 3: Register `HealthModule` in `backend/src/app.module.ts`**

Add the import and include it in the `imports` array:

```typescript
import { HealthModule } from './health/health.module';
```

```typescript
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    HealthModule,
  ],
```

- [ ] **Step 4: Verify it compiles**

```bash
cd backend && npm run build
```

Expected: exit code 0, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/health backend/src/app.module.ts
git commit -m "feat(backend): add health check endpoint"
```

---

### Task 4: Add backend Dockerfile.dev

**Files:**
- Create: `backend/Dockerfile.dev`
- Create: `backend/.dockerignore`

**Interfaces:**
- Produces: a Docker image that runs `npm run start:dev` on container start, exposing port 3001.

- [ ] **Step 1: Create `backend/.dockerignore`**

```
node_modules
dist
npm-debug.log
.git
```

- [ ] **Step 2: Create `backend/Dockerfile.dev`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "start:dev"]
```

- [ ] **Step 3: Build the image to verify it's valid**

```bash
cd backend && docker build -f Dockerfile.dev -t web-solicitations-backend-dev .
```

Expected: build completes successfully (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add backend/Dockerfile.dev backend/.dockerignore
git commit -m "feat(backend): add dev Dockerfile with hot-reload"
```

---

### Task 5: Scaffold Next.js frontend project

**Files:**
- Create: `frontend/` (entire `create-next-app` output)

**Interfaces:**
- Produces: a runnable Next.js project at `frontend/` with `npm run dev` script, listening on port 3000.

- [ ] **Step 1: Generate the Next.js project**

Run from the repo root:

```bash
npx -y create-next-app@latest frontend --typescript --app --no-tailwind --no-src-dir --import-alias "@/*" --eslint --use-npm
```

Expected: command completes, `frontend/` directory exists with `package.json`, `app/page.tsx`, `app/layout.tsx`.

- [ ] **Step 2: Verify it boots locally**

```bash
cd frontend && npm run dev
```

Expected: console shows the app ready on `http://localhost:3000`. Stop it with Ctrl+C once confirmed.

- [ ] **Step 3: Commit**

```bash
git add frontend
git commit -m "feat(frontend): scaffold Next.js project"
```

---

### Task 6: Add frontend Dockerfile.dev

**Files:**
- Create: `frontend/Dockerfile.dev`
- Create: `frontend/.dockerignore`

**Interfaces:**
- Produces: a Docker image that runs `npm run dev` on container start, exposing port 3000.

- [ ] **Step 1: Create `frontend/.dockerignore`**

```
node_modules
.next
npm-debug.log
.git
```

- [ ] **Step 2: Create `frontend/Dockerfile.dev`**

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

- [ ] **Step 3: Build the image to verify it's valid**

```bash
cd frontend && docker build -f Dockerfile.dev -t web-solicitations-frontend-dev .
```

Expected: build completes successfully (exit code 0).

- [ ] **Step 4: Commit**

```bash
git add frontend/Dockerfile.dev frontend/.dockerignore
git commit -m "feat(frontend): add dev Dockerfile with hot-reload"
```

---

### Task 7: Add root docker-compose.yml and environment files

**Files:**
- Create: `docker-compose.yml`
- Create: `.env`
- Create: `.env.example`
- Create: `.gitignore`

**Interfaces:**
- Consumes: `backend/Dockerfile.dev` (Task 4), `frontend/Dockerfile.dev` (Task 6).
- Produces: `postgres`, `backend`, `frontend` services wired together, startable via `docker compose up`.

- [ ] **Step 1: Create `.env.example`**

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=solicitations
POSTGRES_PORT=5432
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

- [ ] **Step 2: Create `.env` (copy of `.env.example` with the same values, used for local dev)**

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=solicitations
POSTGRES_PORT=5432
BACKEND_PORT=3001
FRONTEND_PORT=3000
```

- [ ] **Step 3: Create root `.gitignore`**

```
node_modules
dist
.next
.env
*.log
```

- [ ] **Step 4: Create `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "${POSTGRES_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_NAME: ${POSTGRES_DB}
      PORT: 3001
    ports:
      - "${BACKEND_PORT}:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT}:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

- [ ] **Step 5: Validate the compose file syntax**

```bash
docker compose config --quiet
```

Expected: exit code 0, no output (no YAML/interpolation errors).

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "feat: add docker-compose orchestration for postgres, backend, frontend"
```

Note: `.env` itself is intentionally not committed (it's in `.gitignore`); `.env.example` is the tracked template.

---

### Task 8: Full-stack integration verification

**Files:**
- None created/modified — verification only.

**Interfaces:**
- Consumes: all services defined in Tasks 1–7.

- [ ] **Step 1: Build and start all services**

```bash
docker compose up -d --build
```

Expected: exit code 0, three containers created (`postgres`, `backend`, `frontend`).

- [ ] **Step 2: Verify all containers are healthy/running**

```bash
docker compose ps
```

Expected: `postgres` shows state `running (healthy)`, `backend` and `frontend` show state `running`.

- [ ] **Step 3: Verify backend health endpoint reports DB connected**

```bash
curl -s http://localhost:3001/health
```

Expected: `{"status":"ok","database":"connected"}`. If `database` is `disconnected`, run `docker compose logs backend` to diagnose before continuing.

- [ ] **Step 4: Verify frontend serves the default page**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `200`.

- [ ] **Step 5: Verify backend hot-reload**

Edit `backend/src/health/health.controller.ts`, changing the returned `status` field value from `'ok'` to `'ok-reloaded'`, save, then:

```bash
sleep 3 && curl -s http://localhost:3001/health
```

Expected: response includes `"status":"ok-reloaded"` without restarting the container. Revert the change afterward and confirm `curl -s http://localhost:3001/health` shows `"status":"ok"` again.

- [ ] **Step 6: Verify frontend hot-reload**

In `frontend/app/page.tsx`, find the heading text `Get started by editing` (default `create-next-app` boilerplate) and change it to `Hot reload check`, save, then:

```bash
sleep 3 && curl -s http://localhost:3000 | grep -q "Hot reload check" && echo "FOUND"
```

Expected: prints `FOUND`. Revert the text back to `Get started by editing` afterward.

- [ ] **Step 7: Tear down**

```bash
docker compose down
```

Expected: exit code 0, containers removed, named volume `postgres_data` persists (not using `-v`).

- [ ] **Step 8: Final commit (only if Step 5/6 reverts left any diff, otherwise skip)**

```bash
git status
```

If clean, no commit needed — the scaffold is complete.
