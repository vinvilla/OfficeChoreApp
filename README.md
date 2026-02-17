# 🧹 Office Chore Manager

A full-stack application for managing and scheduling office chores with an Outlook-style calendar interface.

## Features

- **Calendar Views**: Toggle between Week and Month views (Outlook-style)
- **Recurring Chores**: Daily, Weekly, Bi-weekly, and Monthly recurrence options
- **Team Management**: Add/remove team members with color coding
- **Auto-Rotation**: Automatically rotate chore assignments among a pool of team members
- **Drag & Drop**: Reschedule chores by dragging cards to new dates
- **Status Tracking**: Mark chores as done, with overdue warnings for past-due items
- **Color-coded Assignees**: Each team member has a unique color shown on their chores

## Tech Stack

- **Backend**: Node.js + Express (REST API, in-memory store)
- **Frontend**: React 18 (Create React App)

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
npm start
```

The API server starts on `http://localhost:3001`.

### 2. Start the Frontend

```bash
cd frontend
npm install
npm start
```

The app opens in your browser at `http://localhost:3000`.

## API Endpoints

### Team Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/team` | List all members |
| POST | `/api/team` | Add a member (`{ name, color }`) |
| DELETE | `/api/team/:id` | Remove a member |

### Chores
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chores` | List all chore templates |
| POST | `/api/chores` | Create a chore |
| PUT | `/api/chores/:id` | Update a chore |
| DELETE | `/api/chores/:id` | Delete a chore |

### Instances (Calendar Events)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instances?start=&end=` | Get instances in date range |
| PUT | `/api/instances/:id` | Update an instance (status, date, assignee) |
| POST | `/api/instances/generate` | Regenerate instances for a date range |

## Chore Data Model

```json
{
  "title": "Clean Kitchen",
  "description": "Wipe counters, load dishwasher",
  "assigneeId": "member-uuid",
  "recurrence": { "type": "weekly", "day": 1 },
  "autoRotate": true,
  "rotationPool": ["member-uuid-1", "member-uuid-2"]
}
```

### Recurrence Types
- `once` — Single occurrence on a specific date
- `daily` — Every day
- `weekly` — Every week on a specific day (0=Sun, 6=Sat)
- `biweekly` — Every two weeks on a specific day
- `monthly` — Every month on a specific date (1–28)

## Extending

The backend uses an in-memory store for simplicity. To persist data, replace the `db` object with a database (SQLite, PostgreSQL, MongoDB, etc.). The API interface stays the same.
