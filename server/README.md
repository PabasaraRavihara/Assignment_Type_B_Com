# Server - Todo App API

This is the Express RESTful API providing endpoints for the Todo App.

## Features
- **Express.js**: Handling routing and middleware.
- **Mongoose**: Schemas and Object Data Modeling for MongoDB.
- **Joi Validation**: Form and payload data validation before hitting the database model.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   PORT=5000
   # Local MongoDB connection
   MONGO_URI=mongodb://127.0.0.1:27017/todoapp 
   # Or use a MongoDB Atlas Connection String
   # MONGO_URI=mongodb+srv://<user>:<password>@cluster0.../todoapp
   ```

3. Start the server (development mode uses nodemon):
   ```bash
   npm run dev
   ```

## API Endpoints

- `GET /api/todos`: Retrieve all TODOs
- `POST /api/todos`: Create a new TODO
- `PUT /api/todos/:id`: Update an existing TODO
- `PATCH /api/todos/:id/done`: Toggle the 'done' state of a TODO
- `DELETE /api/todos/:id`: Delete a TODO

## Limitations / Assumptions
- The server does not handle User Authentication or JWT sessions as they exceed the core scope, however this architecture sets it up perfectly for future integration.
- Cross-Origin Resource Sharing (CORS) is widely opened `app.use(cors())` to simplify local testing setups between the client and development server port.
