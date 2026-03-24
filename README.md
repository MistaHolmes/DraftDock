# 📝 DraftDock

**DraftDock** is a blogging platform built with a modern monorepo setup using Turborepo, Next.js, and a shared UI library.

🌐 **Live Site:** [https://frontend-1113988436.asia-south1.run.app/blogs](https://frontend-1113988436.asia-south1.run.app/blogs)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MistaHolmes/DraftDock.git
cd DraftDock
````

### 2. Start Services with Docker Compose

Make sure Docker is installed and running.

```bash
docker-compose up -d
```

This starts required backend services like the database and Redis.

### 3. Install Node Dependencies

```bash
npm install
```

### 4. Start the Dev Server

```bash
npm run dev
```

This will start the development server.
Now open the frontend at: [http://localhost:5173](http://localhost:5173)

---

## 🐳 Run Deployed Frontend Locally (Optional)

To run the deployed frontend Docker image locally:

### 1. Pull the Docker Image

```bash
docker pull mistaholmes/draftdockfe:latest
```

### 2. Run the Container

```bash
docker run -p 3000:3000 mistaholmes/draftdockfe:latest
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

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

---

## 🏃 Running Apps Individually (Without Turbo)

If `npm run dev` fails in the root with `turbo: not found`, you can start each service individually in separate terminal windows:

### 1. Start Redis
```bash
cd apps/backend
docker-compose up -d redis
```

### 2. Start Backend API
```bash
cd apps/backend
npm run dev
```

### 3. Start Frontend App
```bash
cd apps/frontend
npm run dev
```

