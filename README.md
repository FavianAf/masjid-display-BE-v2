# Masjid Display Backend V2

Backend API untuk aplikasi **Masjid Display** yang digunakan pada Android TV.

V2 merupakan rewrite dari [Masjid Display Backend V1](https://github.com/FavianAf/masjid-display-BE) menggunakan **TypeScript, Bun, ElysiaJS, dan Drizzle ORM**.

---

## Tech Stack

* **TypeScript** — Programming language
* **Bun** — Runtime & package manager
* **ElysiaJS** — Backend framework
* **Drizzle ORM** — Database ORM
* **PostgreSQL** — Database
* **JWT** — Authentication
* **MyQuran API** — Prayer schedule provider
* **Vercel** — Deployment

---

### Layer Responsibility

| Layer      | Responsibility                                 |
| ---------- | ---------------------------------------------- |
| Route      | HTTP endpoint dan request validation           |
| Controller | Mengatur request/response HTTP jika diperlukan |
| Service    | Business logic                                 |
| Repository | Akses database                                 |
| Provider   | Komunikasi dengan external API                 |
| Schema     | Validation request/response                    |

Business logic tidak ditempatkan langsung di route.

---

## Project Structure

```text
masjid-display-be-v2/
│
├── src/
│   │
│   ├── app/
│   │   ├── app.ts
│   │   ├── routes.ts
│   │   └── plugins/
│   │       ├── auth.ts
│   │       ├── cors.ts
│   │       ├── error-handler.ts
│   │       └── openapi.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── constants.ts
│   │
│   ├── db/
│   │   ├── index.ts
│   │   └── schema/
│   │       ├── users.ts
│   │       ├── masjids.ts
│   │       ├── masjid-settings.ts
│   │       ├── hadists.ts
│   │       ├── infaq.ts
│   │       └── index.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── masjid/
│   │   ├── sholat/
│   │   ├── hadist/
│   │   ├── infaq/
│   │   └── display/
│   │
│   ├── shared/
│   │   ├── errors/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── main.ts
│
├── drizzle/
│   └── migrations/
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── .gitignore
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── bun.lock
└── README.md
```

---

## Shared

`shared` hanya digunakan untuk kode yang benar-benar digunakan oleh beberapa module dan tidak menjadi bagian dari business domain tertentu.

```text
shared/
├── errors/
├── types/
└── utils/
```

Contoh:

```text
shared/errors/app-error.ts
shared/utils/date.ts
shared/utils/jwt.ts
```

Business logic seperti perhitungan jadwal sholat tidak diletakkan di `shared`.

---

## Database

Database menggunakan PostgreSQL dan Drizzle ORM.

Schema database berada di:

```text
src/db/schema/
```

Migration berada di:

```text
drizzle/migrations/
```

Contoh:

```text
src/db/
├── index.ts
└── schema/
    ├── users.ts
    ├── masjids.ts
    ├── masjid-settings.ts
    ├── hadists.ts
    └── infaq.ts
```

---

## Environment

Copy `.env.example` menjadi `.env`.

```bash
cp .env.example .env
```

Example:

```env
APP_ENV=development
APP_PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/masjid_display

JWT_SECRET=your-secret

MYQURAN_BASE_URL=https://api.myquran.com/v3

CORS_ORIGIN=*
```

Jangan commit file `.env`.

---

## Installation

Install dependencies:

```bash
bun install
```

Setup database:

```bash
bun run db:migrate
```

Run development server:

```bash
bun run dev
```

Run production:

```bash
bun run start
```

---

## API Documentation

API documentation menggunakan OpenAPI.

Development:

```text
http://localhost:3000/swagger
```

Dokumentasi harus selalu mengikuti schema request dan response yang digunakan oleh endpoint.

---

## Testing

Test dibagi menjadi:

```text
tests/
├── unit/
└── integration/
```

### Unit Test

Digunakan untuk business logic.

```bash
bun test
```

### Integration Test

Digunakan untuk menguji flow API secara keseluruhan.

```text
HTTP
 ↓
Route
 ↓
Service
 ↓
Repository
 ↓
Database
```

---

## Health Check

Backend menyediakan endpoint:

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

---

## Development Principle

Project mengikuti beberapa prinsip:

* Keep modules independent.
* Keep business logic inside services.
* Keep database access inside repositories.
* Keep external API communication inside providers.
* Keep HTTP concerns inside routes/controllers.
* Avoid unnecessary abstraction.
* Prefer type-safe implementation.
* Validate external and client input.
* Keep modules cohesive and loosely coupled.

Struktur project dibuat untuk mendukung perkembangan aplikasi tanpa memaksakan kompleksitas enterprise sejak awal.

---

## References

* [ElysiaJS](https://elysiajs.com/)
* [Bun](https://bun.com/)
* [Drizzle ORM](https://orm.drizzle.team/)
* [PostgreSQL](https://www.postgresql.org/)
* [Vercel](https://vercel.com/)
* [Masjid Display Backend V1](https://github.com/FavianAf/masjid-display-BE)
