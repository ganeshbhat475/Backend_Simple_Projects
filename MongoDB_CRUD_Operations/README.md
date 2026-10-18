# MongoDB Task Board

A small server-rendered CRUD app using Express, Handlebars, and the MongoDB Node.js driver (`mongodb` 7.x).

## Run locally

Requirements: Node.js 20.19 or newer and MongoDB running locally (or a MongoDB connection string).

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI` to your MongoDB connection string and optionally change `MONGODB_DATABASE`.
3. Start MongoDB, then run `npm start`.
4. Open <http://localhost:3000>.

The app creates a `tasks` collection in the configured database when needed. It keeps one MongoDB client connection open while the server runs.

## CRUD actions

- **Create:** submit the task form.
- **Read:** view the task list on the home page.
- **Update:** edit a task or toggle it between in progress and complete.
- **Delete:** remove a task from the list.

Task titles are required and limited to 120 characters. Descriptions are optional and limited to 1,000 characters.
