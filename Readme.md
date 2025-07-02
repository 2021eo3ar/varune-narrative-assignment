# FourPaws Backend

This repository contains the backend services for **FourPaws**, a social and management platform for pets and their caregivers. The project is written in TypeScript and uses Express with Drizzle ORM on PostgreSQL.

## Documentation
* [Project Structure](docs/file-structure.md)
* [API Reference](docs/api-reference.md)

## Features
- User and pet profile management
- Social feed with posts, comments and likes
- Municipal pet registration workflow
- Marketplace and payments
- Media uploads and notifications

## Architecture
The platform follows a microservice approach. Core services include Auth, User, Pet, Social Feed, Media, Municipal Registration, E-Commerce, Collectibles, Health & Vet and Notification services. Services communicate via REST APIs through an API gateway and use a message queue for long running tasks. PostgreSQL acts as the primary database with Redis for caching. Media files are stored on S3 compatible storage behind a CDN.

```
┌────────────────┐      ┌──────────────────┐     ┌─────────────────┐
│  Next.js API   │─────▶│  API Gateway /   │────▶│  Service Mesh   │
│ (or Express)   │      │  Load Balancer   │     └────────┬────────┘
└────────────────┘      └──────────────────┘              │
       ▲                                                   ▼
       │                                         ┌──────────────────┐
       │                                         │  Microservices   │
       │                                         │  (Node + TS)     │
       │                                         └──────────────────┘
       │                                                   │
       ▼                                                   ▼
┌────────────────┐        ┌─────────────────────────┐    ┌────────────────┐
│  Drizzle ORM   │◀───────│  PostgreSQL (Primary)   │    │  Redis / Cache │
└────────────────┘        └─────────────────────────┘    └────────────────┘
       │                                                   ▲
       ▼                                                   │
┌────────────────┐        ┌─────────────────────────┐    ┌────────────────┐
│  File Storage  │        │  Message Queue (e.g.    │    │  Notifications │
│ (S3 / R2 / GCS)│        │   RabbitMQ / Kafka)     │    └────────────────┘
└────────────────┘        └─────────────────────────┘
```

## Local Development
1. Clone the repository
   ```bash
   git clone <repo-url>
   cd fourpaws_be
   ```
2. Create a `.env` file based on `.env.example` and update database credentials.
   Set `DEFAULT_FOLLOW_USER_ID` to the numeric ID of the Four Paws account so
   new users automatically follow it on registration.
3. Install dependencies
   ```bash
   npm install
   ```
4. Run migrations (for local development)
   ```bash
   npm run migration:generate
   npm run migration:push
   ```
5. Start the API server
   ```bash
   npm run dev
   ```
6. Visit `http://localhost:<port>/api/v1` to access the endpoints.
7. Run the automated test suite
   ```bash
   npm test
   ```

### Public Web Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET`  | `/api/v1/web/profiles` | List public user profiles |
| `GET`  | `/api/v1/web/discover/profiles` | Discover profiles by follower count |
| `GET`  | `/api/v1/web/discover/posts` | Discover popular posts |
| `GET`  | `/api/v1/web/registrations` | **Admin only** municipal registration list |

## Next Steps
A major database schema redesign is planned. Tasks for the upcoming iteration are listed in [docs/improvements-checklist.md](docs/improvements-checklist.md).

