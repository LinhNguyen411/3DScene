# 3D Scene Reconstruction Web App

A web application that converts videos to 3D Gaussian Splatting models, built with FastAPI, Celery, Redis, Flower, PostgreSQL, React.js, Stripe, React Three Fiber, and Docker.

## Features

- **Video-to-3D**: Upload videos and generate 3D Gaussian Splatting models automatically.
- **Model Viewer**: Interactive 3D model viewing powered by React Three Fiber.
- **Admin Dashboard**: Manage settings and configurations via a web-based admin panel.
- **Background Processing**: Asynchronous tasks handled by Celery with Redis broker.
- **Monitoring**: Real-time task monitoring using Flower.
- **Payment Integration**: Stripe for handling payments.
- **Containerized**: Fully Dockerized for easy development and deployment.

## Tech Stack

- **Backend**:
  - FastAPI
  - Celery
  - Redis
  - Flower
  - PostgreSQL
- **Frontend**:
  - React.js
  - React Three Fiber
  - Stripe JS
  - Tailwind CSS
  - Zustand
- **3D Processing**:
  - OpenSplat (3D Gaussian Splatting)
  - COLMAP (SfM + MVS)
- **Infrastructure**:
  - Docker & Docker Compose
  - NVIDIA Docker Toolkit (GPU passthrough)

## Prerequisites

- **CUDA**: version >= 12.4
- **Docker**: latest stable version
- **NVIDIA Docker Toolkit**: for GPU passthrough

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Environment Variables

1. Copy the example file and rename:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the required values:
   - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
   - `REDIS_URL`
   - `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `VIDEO_STORAGE_PATH` etc.

### 3. Build and Start with Docker

```bash
docker compose up --build
```

This command will:

- Build backend and frontend images
- Start PostgreSQL, Redis, and Flower
- Launch FastAPI and React servers

### 4. Initial Configuration

Open your browser to:

```
https://<frontend_domain>/admin/settings
```

and configure any remaining settings (e.g., default pricing, storage paths).

## Usage

- http://localhost:8081/ - FrontEnd application
- http://localhost:8083/docs - BackEnd Swagger documentions
- http://localhost:8081/flower/ - Flower to view Celery Tasks
- http://localhost:8085/ - MailHog to view mails sent by application
- http://localhost:8086/ - PGAdmin to veiw DB tables and data

## Architecture Diagram

```
┌────────────┐        ┌──────────────┐        ┌──────────────┐
│   Client   │◄──────►│   React App  │◄──────►│ React Three  │
│  (Browser) │        └──────┬───────┘        │   Fiber      │
└────────────┘               │                └────┬─────────┘
                            ▼                      ▼
                    ┌──────────────┐        ┌──────────────┐
                    │    FastAPI   │◄──────►│ PostgreSQL DB│
                    └──────┬───────┘        └──────────────┘
                           ▼
                    ┌──────────────┐
                    │    Celery    │◄──────► Redis
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │  OpenSplat   │
                    └──────────────┘
```


## Acknowledgements

- [OpenSplat](https://github.com/pierotofy/opensplat) — for 3D Gaussian Splatting
- [COLMAP](https://colmap.github.io/) — for Structure-from-Motion and MVS pipeline
- [Git](https://git-scm.com/) — for version control
- [todo-fastapi-reactjs](https://gitlab.com/FedorGN/todo-fastapi-reactjs) — for the initial project template
