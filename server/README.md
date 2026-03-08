# Cortex API

Back-end da plataforma acadêmica Cortex. Node.js + Express + MongoDB + JWT.

## Stack

- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Banco**: MongoDB via Mongoose 8
- **Auth**: JWT (jsonwebtoken)
- **Upload**: Multer + AWS SDK v3 (compatível com Cloudflare R2)

## Instalação

```bash
# 1. Clone e instale dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 3. Rode em desenvolvimento
npm run dev
```

## Variáveis de ambiente

Veja `.env.example` — todos os campos são obrigatórios em produção.

| Variável | Descrição |
|---|---|
| `MONGO_URI` | String de conexão MongoDB Atlas |
| `JWT_SECRET` | Chave secreta JWT (mínimo 32 chars) |
| `STORAGE_*` | Credenciais Cloudflare R2 ou AWS S3 |
| `CLIENT_URL` | URL do front-end (para CORS) |

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/register` | Cadastro |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Perfil autenticado |
| GET/POST | `/api/semesters` | Semestres |
| GET/POST | `/api/semesters/:id/subjects` | Disciplinas |
| GET | `/api/subjects/:id` | Disciplina por ID |
| POST | `/api/subjects/:id/materials` | Upload de material |
| GET/POST | `/api/subjects/:id/notes` | Notas |
| GET/POST/PATCH/DELETE | `/api/tasks` | Tarefas |
| GET | `/api/hours/summary` | Resumo de horas complementares |
| POST | `/api/hours/activities` | Registrar atividade |
| PUT | `/api/hours/goals` | Definir metas por categoria |

Todas as rotas (exceto `/auth`) exigem header `Authorization: Bearer <token>`.

## Deploy (Render)

1. Crie um Web Service no [Render](https://render.com)
2. Conecte este repositório (pasta `cortex-api`)
3. Build command: `npm install`
4. Start command: `node src/server.js`
5. Adicione as variáveis de ambiente no painel do Render
