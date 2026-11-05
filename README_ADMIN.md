# CMS Admin & Arquitectura Vercel — Portfolio Franco Calegari

Panel de administración (CMS) y API Serverless para gestionar proyectos del portfolio con **Vercel** y **SpiderWebArgAPI** (SQL Database, Cloud Storage `#46` y preparación para SpiderIA).

## 🚀 Configuración de Variables de Entorno (`.env`)

En desarrollo local (archivo `.env`) y en el panel de **Vercel → Settings → Environment Variables**, configura:

```env
spiderapykey=TU_API_KEY
spiderwebdbname="sw_Franco Calegari_PortfolioFrancoCalegari"
spidercloudstorageid=46
ADMIN_SECRET_KEY=franco_admin_2026
CHATBOT_ENABLED=false
```

## 📦 Ejecución Local

```bash
npm install
npm run dev
```

- **Portfolio Público**: `http://localhost:3000/index.html`
- **Catálogo de Proyectos**: `http://localhost:3000/proyectos.html`
- **CMS Admin**: `http://localhost:3000/admin`

## 🔌 Endpoints Serverless (`/api`)

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/projects` | Obtiene todos los proyectos desde SQL en SpiderWebArgAPI (con fallback a `json/proyectos.json`). |
| `POST` | `/api/projects` | Crea un proyecto en SQL o sincroniza desde JSON (`{"action": "seed"}`). Requiere header `x-admin-key`. |
| `PUT` | `/api/projects?id=:id` | Actualiza un proyecto existente en SQL. Requiere `x-admin-key`. |
| `PATCH` | `/api/projects?id=:id` | Alterna el estado `destacado` (`1` / `0`). Requiere `x-admin-key`. |
| `DELETE` | `/api/projects?id=:id` | Elimina el proyecto en SQL (y su imagen asociada en Cloud Storage si corresponde). Requiere `x-admin-key`. |
| `GET` | `/api/storage?download=:id` | Proxy público con caché para servir imágenes alojadas en SpiderCloudStorage sin exponer `X-API-KEY`. |
| `POST` | `/api/storage` | Sube una imagen al proyecto `#46` de SpiderCloudStorage. Requiere `x-admin-key`. |
| `GET` / `POST` | `/api/chat` | Endpoint previsto para el futuro Chatbot con SpiderIA (`/ia/models`, `/ia/chat`, `/ia/usage`). Se activa con `CHATBOT_ENABLED=true`. |
