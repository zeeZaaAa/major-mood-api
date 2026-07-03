# Mood of the Major

A community-driven, anonymous backend RESTful platform built for university students to share their current emotional state within their faculty or department.

---

## Tech Stack

- **Framework:** Node.js (ES Modules) & Express 5
- **Database:** MongoDB via Mongoose ODM
- **Authentication:** JWT (Access & Refresh Tokens) & Google OAuth2
- **Validation:** Zod

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/zeeZaaAa/major-mood-api.git
cd major-mood-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root using the values from `.env.example`.

### 4. Start the Server

```bash
node main.js
```

The server will run at:

```text
http://localhost:8080
```

(or the port specified in your `PORT` environment variable.)

---

# API Endpoints

## Authentication

**Base Route:** `/api/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/google-login` | Start Google OAuth authentication flow |
| GET | `/callback` | Google OAuth callback route |
| POST | `/refresh` | Refresh access and refresh tokens |
| POST | `/logout` | Log out and clear the current session |

---

## Posts & Moods

**Base Route:** `/api/post`

> Authentication Required

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/feed` | View the anonymous mood feed |
| POST | `/create` | Create a new anonymous mood post |
| POST | `/:id/react` | React to a mood post |
| POST | `/:id/report` | Report an inappropriate post |
| PATCH | `/:id` | Update your own mood post |
| DELETE | `/:id` | Delete your own mood post |
| GET | `/reported-posts` | **Admin Only** — View all reported posts |
| PATCH | `/:id/ban` | **Admin Only** — Ban or hide a reported post |

---

## Users

**Base Route:** `/api/user`

> Authentication Required

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/me` | Get the current user's profile |
| GET | `/banned-users` | **Admin Only** — View banned users |
| POST | `/:id/ban` | **Admin Only** — Ban a user |
| POST | `/:id/unban` | **Admin Only** — Unban a user |

---

## Notes

- Anonymous mood posting
- JWT Authentication
- Google OAuth2 Login
- MongoDB with Mongoose
- Zod request validation
- Admin moderation tools
- RESTful API architectureV