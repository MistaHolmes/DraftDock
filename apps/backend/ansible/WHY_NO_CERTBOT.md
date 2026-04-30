# Why This Project Doesn't Need Certbot

## The Short Answer

**Cloudflare handles HTTPS for us.** The EC2 server never has to deal with certificates.

---

## A Little Background — What Is HTTPS?

When you visit a website over `https://`, your browser and the server do a "handshake" to encrypt the connection. For that handshake to work, the server needs a **TLS certificate** — a small file that proves the server is who it says it is.

Certbot is a free tool that obtains and renews those certificates automatically from a certificate authority called Let's Encrypt. Most self-hosted servers need it so browsers don't show a "Not Secure" warning.

---

## How Traffic Actually Reaches This Server

```
Your Browser
     │
     │  HTTPS (encrypted)
     ▼
┌─────────────────┐
│   Cloudflare    │  ← TLS terminates here. Certificate lives here.
│  (Edge Proxy)   │
└─────────────────┘
     │
     │  Plain HTTP (port 80, inside a private tunnel)
     ▼
┌─────────────────┐
│  EC2 Instance   │
│  nginx → :3000  │  ← This is our server. No certificate needed here.
└─────────────────┘
```

Cloudflare sits in front of our server and acts as a middleman:

1. **Your browser connects to Cloudflare over HTTPS.** Cloudflare owns the certificate, handles the encryption, and your browser is happy — the green padlock appears.
2. **Cloudflare then forwards the request to our EC2 server over plain HTTP** (port 80) through its own secure internal network.
3. **Our nginx on EC2 receives a normal HTTP request**, processes it, and sends back a response to Cloudflare.
4. Cloudflare encrypts the response and sends it back to your browser.

The EC2 instance never speaks directly to a browser. It only ever talks to Cloudflare, so it never needs to prove its identity to a browser — **and therefore never needs a certificate**.

---

## Why the Previous Project Worked the Same Way

The previous project used the exact same pattern:

- Nginx was configured to `listen 80` (plain HTTP only).
- DNS records pointed at the server **through Cloudflare's proxy** (the orange cloud icon in Cloudflare's dashboard).
- No certbot tasks existed anywhere in the playbook or Terraform.

This project is set up identically:

- `templates/nginx.conf.j2` → nginx listens on port 80 only.
- `deploy.yml` → no certbot installation steps.
- Stage 3 of `deploy.yml` → updates Cloudflare DNS A records automatically after deployment, so Cloudflare always points to the new EC2 IP.

---

## When Would You Need Certbot?

You would only need certbot (or another certificate solution) if **one of these were true**:

| Scenario | Needs Certificate? |
|---|---|
| Cloudflare proxy is ON (orange cloud) | ❌ No — Cloudflare handles it |
| Cloudflare proxy is OFF (gray cloud / DNS only) | ✅ Yes — browser connects directly to EC2 |
| No Cloudflare, just a raw server with a domain | ✅ Yes — certbot needed |
| Accessing by IP address only | ❌ No — but also no HTTPS |

**As long as the Cloudflare proxy is enabled (orange cloud)** for the DNS records that Stage 3 creates, you never need certbot on this server.

---

## One Thing to Keep in Mind

Inside Cloudflare's dashboard, the SSL/TLS setting should be set to **"Flexible"** or **"Full"**:

- **Flexible** — Cloudflare ↔ EC2 connection is plain HTTP. ✅ Works with this setup, no cert needed on EC2.
- **Full** — Cloudflare ↔ EC2 connection uses HTTPS, but the cert on EC2 can be self-signed. Requires a cert on EC2.
- **Full (Strict)** — Same as Full but the cert must be a trusted one. Requires certbot or Cloudflare Origin CA.

This deployment uses **Flexible**, which is why no certbot is needed.

---

## Summary

| Question | Answer |
|---|---|
| Does the browser connect directly to EC2? | No — it connects to Cloudflare first |
| Who owns the HTTPS certificate? | Cloudflare |
| Does nginx need to serve HTTPS? | No — it serves plain HTTP on port 80 |
| Do we need certbot? | No |
| Is this secure? | Yes — the browser ↔ Cloudflare connection is fully encrypted |
