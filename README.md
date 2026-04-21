# SureShift ERP — Docker + PocketBase + Cloudflare Tunnel

Full-stack relocation management ERP running on Ubuntu (WSL) behind a Cloudflare Tunnel.

## Stack

| Service | Container | Subdomain |
|---|---|---|
| React ERP Frontend | `sureshift-erp` | `erp.sureshift.in` |
| PocketBase (SureShift) | `pocketbase-sureshift` | `pb.sureshift.in` |
| PocketBase (FreightIt) | `pocketbase-freightit` | `pb.freightit.in` |
| n8n Automation | `n8n` | `automation.freightit.in` |
| Evolution Go (WhatsApp) | `evolution-go` | `api.freightit.in` |
| Postiz (Social) | `postiz` | `social.freightit.in` |
| Cloudflare Tunnel | `cloudflared` | Routes all subdomains |

## Setup

### 1. Clone and configure
```bash
git clone https://github.com/YOUR_ORG/sureshift-erp.git
cd sureshift-erp
cp .env.example .env
nano .env  # fill in your real values
```

### 2. Generate encryption key
```bash
openssl rand -hex 32
# paste output as PB_ENCRYPTION_KEY in .env
```

### 3. Add Cloudflare Tunnel route
In **Cloudflare Dashboard → Zero Trust → Networks → Tunnels → your tunnel → Public Hostnames**:
```
erp.sureshift.in  →  http://sureshift-erp:80
```

### 4. Deploy
```bash
# First time — builds SureShift images
docker compose up -d --build pocketbase-sureshift sureshift-erp
docker compose restart cloudflared

# All services
docker compose up -d
```

### 5. First login
- URL: `https://erp.sureshift.in`
- Email: `admin@sureshift.in`
- Password: value of `PB_SUPER_ADMIN_PASS` in your `.env`

**Change the password immediately after first login.**

## Project Structure

```
docker-compose.yml          ← all 13 services in one file
.env.example                ← template (copy to .env)
.gitignore

sureshift/
  pocketbase/
    Dockerfile              ← custom PB build with migrations + hooks
    pb_migrations/
      001_initial_schema.js ← creates 11 ERP collections on first boot
    pb_hooks/
      main.pb.js            ← auto-numbering + admin seed + ping route
  frontend/
    Dockerfile              ← multi-stage: Vite build → Nginx
    src/
      App.jsx               ← PocketBase auth wired
      lib/pb.js             ← PB client + collection services
      hooks/
        useAuth.js          ← login/logout/token refresh
        useCollection.js    ← useCollection, useMutation, useSettings
```

## Useful Commands

```bash
docker compose ps                        # status of all containers
docker compose logs -f pocketbase-sureshift  # PB logs
docker compose logs -f sureshift-erp    # frontend logs
docker compose up -d --build sureshift-erp   # rebuild frontend only
docker compose restart cloudflared      # restart tunnel
```

## ERP Modules

Enquiry → Survey → Quotation → CFR (Booking) → Operations → Invoice → Receipt

Document numbering: `SS-ENQ-NDLH-2627-0001`, `SS-QUOT-NDLH-2627-0001/2`, etc.

## Roles

`super_admin` · `branch_head` · `sales_exec` · `ops_exec` · `finance_exec` · `surveyor` · `vehicle_vendor` · `manpower_vendor`
