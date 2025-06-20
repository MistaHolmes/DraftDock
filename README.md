# 📝 DraftDock

**DraftDock** is a blogging platform built with a modern monorepo setup using Turborepo, Next.js, and a shared UI library.

🌐 **Live Site:** [https://frontend-1113988436.asia-south1.run.app/blogs](https://frontend-1113988436.asia-south1.run.app/blogs)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/draftdock
cd draftdock
````

---

## 🐳 Run with Docker

### Build the Docker Image

```bash
docker build -t draftdock .
```

### Run the Container

```bash
docker run -p 3000:3000 draftdock
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐙 Run with Docker Compose

If you have a `docker-compose.yml` file at the root, you can spin up all services for local testing:

```bash
docker-compose up --build
```

---

## 🧱 Monorepo Structure

```
apps/
  web/               # Frontend (Next.js)
  docs/              # Optional documentation app

packages/
  ui/                # Shared UI components
  eslint-config/     # Shared ESLint config
  typescript-config/ # Shared TypeScript config
```

---

## 📦 Tech Stack

* Monorepo with Turborepo
* Next.js + React
* Tailwind CSS
* TypeScript
* ESLint + Prettier
* Docker + Docker Compose

---

## 📌 Deployment

Frontend is deployed at:

👉 [https://frontend-1113988436.asia-south1.run.app/blogs](https://frontend-1113988436.asia-south1.run.app/blogs)

---

## 🛠️ License

MIT
