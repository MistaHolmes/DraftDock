# Deploy backend on an EC2 instance

This document lists step-by-step commands to deploy the backend on an Ubuntu EC2 instance using Docker Compose and the repository's `apps/backend/deployment/ec2/docker-compose.yml` and `nginx.conf`.

Adjust domain names, environment variables and paths to your setup.

---

## Quick summary
- Use Docker + Docker Compose to run services (Postgres/Redis are expected to be externally available or configured in the compose file).
- Nginx is used as a reverse proxy (the repo contains an nginx config in `deployment/ec2/nginx.conf`).
- Obtain TLS certs with Certbot (standalone mode) or use your preferred ACME flow.

## Assumptions
- Ubuntu 22.04 (or similar Debian-based) server.
- You have a domain name pointed to the server's public IP (e.g. `api.example.com`).
- You have SSH access and sudo privileges.
- Repo already contains `apps/backend/deployment/ec2/docker-compose.yml` and `nginx.conf`.

## 1. Initial server setup (run as a sudo user)

Update packages and install basics:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg lsb-release git ufw
```

Create a deploy user (optional) and add to `docker` group later if desired:

```bash
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG sudo deploy
su - deploy
```

## 2. Install Docker and docker-compose (Compose v2 plugin)

```bash
# Install Docker (official instructions)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Enable docker and add user
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker || true

# Install docker compose plugin (if needed)
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p "$DOCKER_CONFIG/cli-plugins"
curl -SL "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-linux-$(dpkg --print-architecture)" \
  -o "$DOCKER_CONFIG/cli-plugins/docker-compose"
chmod +x "$DOCKER_CONFIG/cli-plugins/docker-compose"
```

Logout and back in if group changes did not take effect.

## 3. Clone the repository and prepare environment

```bash
cd /opt
sudo git clone https://github.com/MistaHolmes/Techincal-Phase-2.git draftdock-backend
cd draftdock-backend/apps/backend/deployment/ec2
# (or clone to /home/deploy and use that path)
```

Create an `.env` file with required environment variables. Example `.env` (replace values):

```bash
cat > .env <<'EOF'
DATABASE_URL=postgresql://user:password@db-host:5432/dbname
REDIS_URL=redis://:password@redis-host:6379
JWT_SECRET=supersecret
CLERK_API_KEY=xxxx
VITE_API_URL=https://api.example.com
PORT=3000
# any other env vars the docker-compose expects
EOF
```

Confirm `docker-compose.yml` and `nginx.conf` are present in the directory. If `docker-compose.yml` references other files, adjust paths accordingly.

## 4. Firewall (UFW) - open required ports

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 5. Start services with Docker Compose

From the directory containing `docker-compose.yml`:

```bash
# Build and start containers in detached mode
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

The compose file in this repo exposes the backend on `3000` and websocket on `3001` (proxied by nginx). Nginx in the compose will listen on 80/443.

## 6. Obtain TLS certificates (Certbot standalone)

If you're running nginx in a container, easiest approach is to temporarily stop the nginx container, run `certbot` in standalone mode on the host, then restart nginx and mount certs.

```bash
# Stop nginx service from the compose (example service name: reverse-proxy)
docker compose stop nginx || docker compose stop reverse-proxy || true

# Install certbot
sudo apt install -y certbot

# Run certbot standalone for your domain(s)
sudo certbot certonly --standalone -d api.example.com --agree-tos --email admin@example.com --non-interactive

# Certificates are under /etc/letsencrypt/live/api.example.com/

# Make sure your docker-compose nginx mounts those paths (update compose if needed), then start nginx again
docker compose up -d nginx || docker compose up -d
```

Alternative: use a certbot Docker container or the `nginx-proxy` + `acme-companion` approach.

## 7. Manage service as systemd (optional)

Create a small systemd service to ensure the compose is started on boot. Example `/etc/systemd/system/draftdock-backend.service`:

```ini
[Unit]
Description=DraftDock Backend (docker-compose)
After=network-online.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/draftdock-backend/apps/backend/deployment/ec2
ExecStart=/usr/bin/docker compose up -d --build
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=600

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now draftdock-backend.service
sudo systemctl status draftdock-backend.service
```

## 8. Updating the deployment (pull new code)

```bash
cd /opt/draftdock-backend
git fetch --all
git checkout main
git pull origin main
cd apps/backend/deployment/ec2
# Recreate containers with the latest image / code
docker compose pull || true
docker compose up -d --build
docker compose ps
```

## 9. Useful commands & troubleshooting

- View logs (all): `docker compose logs -f`
- View specific service logs: `docker compose logs -f backend` or `docker compose logs -f nginx`
- Check container health: `docker ps --filter status=running`
- Inspect container: `docker compose exec backend sh` (or `bash`)
- Check ports listening on server: `ss -tuln | grep -E ":80|:443|:3000|:3001"`

If something fails, check the nginx config mount and environment variables. Use `docker compose logs` to see errors.

## 10. Health check example

Once deployed, verify the backend API is reachable:

```bash
curl -I https://api.example.com/api/health || curl -I http://localhost:3000/api/health
```

Replace `/api/health` with whatever health endpoint your app exposes. Also verify WebSocket: connect to `wss://api.example.com/ws` using your client.

## 11. Notes & recommendations

- Keep secrets in a secure secrets manager or use environment files with restricted permissions (`chmod 600 .env`).
- For production TLS automation, use a solution that integrates with the nginx container (e.g., `nginx-proxy` + `acme-companion`) or run certbot in a companion container.
- Monitor logs with `docker compose logs` or ship logs to a centralized system (Papertrail, Datadog, etc.).
- Backup your database credentials and never commit them to git.

---

If you want, I can:

- Add a sample `systemd` service file into the repo.
- Update the `docker-compose.yml` to mount Certbot's `/etc/letsencrypt` paths automatically.
- Create a secure `.env.example` file containing keys the compose expects.
