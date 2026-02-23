# Sarcstar Judge

Full-stack competitive programming platform inspired by Codeforces and AtCoder.

## Stack

- Frontend: React, Vite, Tailwind CSS, Monaco Editor
- Backend: Node.js, Express
- Database: PostgreSQL
- Code execution: Judge0 API

## Workspace Layout

```text
.
|-- backend
|   |-- package.json
|   |-- .env.example
|   |-- src
|   |   |-- config
|   |   |-- controllers
|   |   |-- db
|   |   |-- middleware
|   |   |-- routes
|   |   |-- services
|   |   |-- utils
|   |   `-- server.js
|   `-- sql
|       |-- schema.sql
|       `-- seed.sql
|-- frontend
|   |-- package.json
|   |-- index.html
|   |-- tailwind.config.js
|   |-- postcss.config.js
|   |-- .env.example
|   `-- src
|       |-- components
|       |-- context
|       |-- hooks
|       |-- layouts
|       |-- pages
|       |-- services
|       |-- utils
|       |-- App.jsx
|       |-- main.jsx
|       `-- index.css
|-- package.json
`-- README.md
```

## Quick Start

1. Install dependencies with `npm install`.
2. Create `backend/.env` from `backend/.env.example`.
3. Create `frontend/.env` from `frontend/.env.example`.
4. Create the PostgreSQL schema with [backend/sql/schema.sql](/C:/Users/sarco/Desktop/imicontest/backend/sql/schema.sql).
5. Optionally seed sample data with [backend/sql/seed.sql](/C:/Users/sarco/Desktop/imicontest/backend/sql/seed.sql).
6. Run both apps with `npm run dev`.

Admin credentials are validated only on the backend via environment variables. The provided default values are:

- Username: `adminlogin`
- Password: `sarcstar_r9`
