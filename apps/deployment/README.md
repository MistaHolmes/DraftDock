# EC2 deployment (Docker Compose + nginx reverse-proxy)

This folder contains a minimal nginx config and a Docker Compose file intended for deploying the backend on an EC2 instance (name-based routing through nginx).

Files added:

- `nginx.conf` — nginx configuration with server blocks for name-based routing:
  - `draftdock-be.abhasbehera.in` → port 3000
  - `wss-draftdock.be.abhasbehera.in` → port 3001
  Installed directly on the host, not in Docker.
- `docker-compose.ec2.yml` — compose file that pulls the backend image from Docker Hub and publishes ports 3000 and 3001 to the host.

Overview
--------

The deployment uses one Docker container and a host-installed nginx:

- `backend` (Docker) — pulled from `mistaholmes/draftdock-be-mar-21:latest`. Listens on ports `3000` and `3001`, published to the host.
- `nginx` (host) — installed on the EC2 instance via `apt`. Routes requests for `draftdock-be.abhasbehera.in` to `127.0.0.1:3000` and `wss-draftdock.be.abhasbehera.in` to `127.0.0.1:3001`.

Before you begin
----------------

- Ensure you have an EC2 instance (Ubuntu) with a security group allowing inbound `80` (HTTP) and SSH.
- Ensure DNS `A` records for `draftdock-be.abhasbehera.in` and `wss-draftdock.be.abhasbehera.in` point to the EC2 public IP in Cloudflare.

Install Docker & Docker Compose plugin (Ubuntu sample)
-----------------------------------------------------

Run on the EC2 instance:

```bash
# update
sudo apt update
sudo apt -y upgrade

# install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# log out and log back in for group changes; or run newgrp docker

# install Docker Compose plugin (if not present)
sudo apt-get install -y docker-compose-plugin

# verify
docker version
docker compose version
```

Project setup on the EC2 instance
---------------------------------

1. Copy the required files from your local machine to the EC2 instance using `scp`. Run these commands **on your local machine** (not on the EC2 instance):

```bash
# copy the compose file
scp deployment/docker-compose.ec2.yml ubuntu@<EC2-IP>:/home/ubuntu/docker-compose.yml

# copy the nginx config
scp deployment/nginx.conf ubuntu@<EC2-IP>:/home/ubuntu/nginx.conf
```

Expected layout on the EC2 instance after SCP:

```
/home/ubuntu/
  ├─ .env
  ├─ docker-compose.yml
  └─ nginx.conf
```

2. Create the environment file that the backend expects. Place the `.env` at `/home/ubuntu/.env` (same folder as the `docker-compose.yml`) and add the needed variables (DB connection, API keys, etc.). Example:

```bash
cat > /home/ubuntu/.env <<EOF
NODE_ENV=production
PORT=3000
WS_PORT=3001
# DB_URL=postgres://user:pass@host:5432/dbname
# other keys...
EOF
```

3. The `nginx.conf` is already configured to route:
  - `draftdock-be.abhasbehera.in` → backend HTTP API (port 3000)
  - `wss-draftdock.be.abhasbehera.in` → WebSocket endpoint (port 3001)

  In Cloudflare, create **A records** pointing both hostnames to your EC2 public IP.

Start the stack (pulling your Docker Hub image)
--------------------------------------------

1. (Already set) `docker-compose.ec2.yml` in this folder is configured to pull the image `mistaholmes/draftdock-be-mar-21:latest`. If you want a different tag, edit the `image:` line.

2. From `/home/ubuntu` on the EC2 instance run (after copying the compose file to `/home/ubuntu/docker-compose.yml`):

```bash
docker compose -f docker-compose.yml up -d
```

This pulls the `backend` image from Docker Hub and starts the backend container (published to host ports `3000` and `3001`).

Install and configure `nginx` on the EC2 instance
-------------------------------------------------

Follow these steps on the EC2 host to install `nginx`, place the provided `nginx.conf`, and start `nginx` with `systemctl`.

```bash
# install nginx (Ubuntu example)
sudo apt update
sudo apt install -y nginx

# copy the nginx.conf you SCP'd to /home/ubuntu into place
sudo cp /home/ubuntu/nginx.conf /etc/nginx/nginx.conf

# test nginx config
sudo nginx -t

# enable and start nginx
sudo systemctl enable --now nginx

# check status
sudo systemctl status nginx

# tail nginx logs
sudo journalctl -u nginx -f
```

Notes:

- The compose file publishes `3000:3000` (HTTP API) and `3001:3001` (WebSocket) to the host. Host-installed nginx routes `draftdock-be.abhasbehera.in` → port 3000 and `wss-draftdock.be.abhasbehera.in` → port 3001.
- The frontend is configured with `VITE_API_URL=https://draftdock-be.abhasbehera.in` and `VITE_WS_URL=wss://wss-draftdock.be.abhasbehera.in` in `apps/frontend/.env`.
- If you place `nginx.conf` somewhere else, update the file path accordingly and reload `nginx` with `sudo systemctl reload nginx`.

Manage the backend stack with systemd
-----------------------------------

You can create a systemd unit to manage the `docker compose` stack so it starts on boot. Example unit (create `/etc/systemd/system/draftdock-deployment.service`) — this unit assumes you placed `docker-compose.yml` and `.env` in `/home/ubuntu`:

```ini
[Unit]
Description=DraftDock deployment (Docker Compose)
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu
ExecStart=/usr/bin/docker compose -f docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start the unit:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now draftdock-deployment.service
sudo systemctl status draftdock-deployment.service
```

To stop or restart later:

```bash
sudo systemctl stop draftdock-deployment.service
sudo systemctl start draftdock-deployment.service
```

Verify
------

- Check containers:

```bash
docker compose -f docker-compose.yml ps
```

- Tail backend logs:

```bash
docker compose -f docker-compose.yml logs -f backend
```

- Test nginx config on the host (after copying `nginx.conf` to `/etc/nginx/nginx.conf`):

```bash
sudo nginx -t
```

- Test HTTP API access:

```bash
curl -v http://draftdock-be.abhasbehera.in/health
```

Stopping / restarting
---------------------

```bash
# stop gracefully
docker compose -f docker-compose.yml down

# start again
docker compose -f docker-compose.yml up -d
```

Cloudflare / TLS note
---------------------

You mentioned you'll use Cloudflare in front of the EC2 instance. In that setup:

- Keep the DNS record proxied (orange cloud) in Cloudflare so Cloudflare terminates TLS for you.
- Nginx only needs to listen on port 80 for proxied traffic; TLS certificates on the host are optional when using Cloudflare in full-origins mode. If you prefer end-to-end TLS, you can still obtain origin certs and mount them into the `nginx` container.

Security notes
--------------

- Ensure your EC2 security group allows inbound `80` (HTTP) from Cloudflare / your tester IPs and SSH for management.
- Lock down `../apps/backend/.env` — do not commit secrets to git.

If you want the backend to be reachable directly on a host port (not recommended when behind nginx), add a `ports` mapping under `backend` in the compose file (e.g. `"3000:3000"`).

Support
-------
If you want, I can:

- Add Cloudflare-specific firewall rules or recommended origin settings.
- Add a `systemd` unit to ensure Docker Compose starts on boot.
- Add a systemd unit to ensure `docker compose` starts on boot.
