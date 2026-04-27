# Client - Todo App Frontend

This is the frontend component of the Todo full-stack application, built using React and Vite.

## Features
- **Reactivity & Speed**: Built with React and structured utilizing Vite for highly accelerated development/building.
- **Premium User Interface**: Styling achieved utilizing exclusively Vanilla CSS as specified. The app is completely responsive, featuring dark-mode styling, glassmorphism UI card components, and subtle micro-transactions.
- **Optimistic UI Updates**: Network performance isn't assumed to be flawless. With `@tanstack/react-query`, all data mutations (Creating, Checking, Deleting, and Editing Todos) update the user interface instantly, creating a latency-free subjective feeling. Error-recovery reverts the action seamlessly if the HTTP request subsequently fails.

## Setup Instructions

1. Ensure the backend is operational on port 5000 (`cd server && npm start`).
2. If your backend is NOT on `http://localhost:5000/api`, create a `.env` in the root of `/client` containing:
   ```env
   VITE_API_URL=http://your_custom_domain/api
   ```
3. Boot the environment:
   ```bash
   npm run dev
   ```

## Assumptions and Trade-offs
- Used absolute minimum dependencies: `axios` for fetches, `@tanstack/react-query` to simplify loading/optimistic state updates, and `lucide-react` for premium SVG iconographies.
- There is no specific routing page for Todos (e.g. `/todos/:id`) as a simplistic robust Todo Application functions exceptionally well effectively organized as a single dashboard page.
