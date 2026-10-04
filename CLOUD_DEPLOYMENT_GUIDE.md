# PlaceMux — Cloud Deployment Guide

This guide details how to deploy **PlaceMux** to production cloud platforms. PlaceMux consists of 4 core components:
1. **PostgreSQL Database** (v16+)
2. **Node.js Express Backend API** (Port 5000)
3. **Python FastAPI AI Microservice** (Port 8000)
4. **React + Vite Frontend SPA** (Static Web App / Nginx)

---

## 🎯 Recommended Deployment Architecture Options

| Strategy | Platform(s) | Best For | Estimated Setup Time |
| :--- | :--- | :--- | :--- |
| **Option A (PaaS / Serverless)** | **Render / Railway + Supabase + Vercel** | Fast deployment, automated SSL, zero server management | ~15 minutes |
| **Option B (VPS / Docker)** | **AWS EC2 / DigitalOcean / Hetzner** | Full control, single containerized instance via Docker Compose | ~20 minutes |

---

## 🚀 Option A: PaaS Microservices Deployment (Render / Supabase / Vercel)

### Step 1: Provision Managed PostgreSQL Database
- **Provider**: Supabase, Render Postgres, Neon, or Railway.
- **Connection String Format**:
  ```env
  DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require
  ```
- **Migration Execution**:
  Run Prisma migrations against the production database:
  ```bash
  cd backend
  npx prisma migrate deploy
  ```

---

### Step 2: Deploy Python FastAPI AI Microservice
- **Platform**: Render (Web Service) or Railway
- **Root Directory**: `ai-service`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- **Environment Variables**:
  - `PORT`: `8000`
  - `PYTHON_VERSION`: `3.11.0`
- **Generated Public URL**: e.g., `https://placemux-ai.onrender.com`

---

### Step 3: Deploy Node.js Express Backend API
- **Platform**: Render (Web Service) or Railway
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build && npx prisma generate`
- **Start Command**: `npm start` (or `node dist/server.js`)
- **Environment Variables**:
  - `PORT`: `5000`
  - `NODE_ENV`: `production`
  - `DATABASE_URL`: `<your-postgres-url>`
  - `JWT_SECRET`: `<generate-a-strong-random-secret>`
  - `JWT_EXPIRES_IN`: `15m`
  - `REFRESH_TOKEN_SECRET`: `<generate-a-second-strong-random-secret>`
  - `REFRESH_TOKEN_EXPIRES_IN`: `7d`
  - `AI_SERVICE_URL`: `https://placemux-ai.onrender.com`
  - `CLIENT_URL`: `https://placemux.vercel.app` (your frontend domain)
- **Generated Public URL**: e.g., `https://placemux-api.onrender.com`

---

### Step 4: Deploy React Frontend SPA
- **Platform**: Vercel, Netlify, or Render Static Site
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables / Configuration**:
  Ensure production API calls point to your Backend URL (`https://placemux-api.onrender.com/api`).
- **SPA Rewrites**:
  For Vercel (`vercel.json`) or Netlify (`_redirects`), add fallback rewrite rules to support client-side routing (`/* -> /index.html`).

---

## 🐳 Option B: Full Stack Docker Compose Deployment (VPS / EC2)

If deploying to an **AWS EC2**, **DigitalOcean Droplet**, or any Linux VPS with Docker installed:

### 1. SSH into VPS & Clone Repository
```bash
git clone https://github.com/your-org/placemux.git
cd placemux
```

### 2. Configure Production Environment
Copy `.env.example` and update production credentials:
```bash
cp .env.example .env
```
Edit `.env`:
```env
POSTGRES_USER=placemux_admin
POSTGRES_PASSWORD=<strong_db_password>
POSTGRES_DB=placemux_prod_db
DATABASE_URL=postgresql://placemux_admin:<strong_db_password>@postgres:5432/placemux_prod_db?schema=public

JWT_SECRET=<strong_jwt_access_secret>
REFRESH_TOKEN_SECRET=<strong_jwt_refresh_secret>
CLIENT_URL=https://yourdomain.com
AI_SERVICE_URL=http://ai-service:8000
```

### 3. Build & Launch Docker Stack
```bash
docker-compose up --build -d
```

### 4. Run Prisma Database Migrations inside Container
```bash
docker exec -it placemux-backend npx prisma migrate deploy
```

### 5. Enable HTTPS / SSL with Nginx Certbot
Set up Let's Encrypt SSL certificate for domain:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

---

## 🛡 Production Checklist Before Going Live

- [ ] **Secrets Security**: Replaced default `JWT_SECRET` and `REFRESH_TOKEN_SECRET` with 256-bit cryptographically secure strings.
- [ ] **CORS Settings**: Set `CLIENT_URL` in backend `.env` to match exact frontend domain.
- [ ] **Database Backups**: Enabled automated daily snapshots on PostgreSQL instance.
- [ ] **Database Connection Pooling**: Verified database connection limits are configured for production load.
- [ ] **Prisma Migration Status**: Executed `npx prisma migrate deploy` to synchronize database tables.
- [ ] **SSL / TLS Encryption**: Enforced HTTPS across all microservices and frontend URLs.
