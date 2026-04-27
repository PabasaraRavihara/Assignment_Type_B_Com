# Full Stack TODO App - Type B Digital Assignment

This is a full-stack TODO application built for the Type B Digital "Full Stack Intern" initial technical assessment. The project features a premium modern UI, optimistic UI updates for a seamless user experience, and a robust monolithic workspace setup.

## Video Demonstration & Code Walkthrough

Since this is a submission, the requested PR will include:
1. Short demo video of the platform.
2. A 5-minute walkthrough of the code and architecture.

## Project Structure

This project uses **npm workspaces** to manage a monorepo setup:

- `client/`: A React frontend scaffolded via Vite, featuring Vanilla CSS for premium styling and React Query for state management.
- `server/`: A Express backend connected to a MongoDB database, featuring robust Form Validation via Joi.

## Running Locally

Because this is a monorepo, everything can be executed from the root directory easily via the provided package scripts. 

### Prerequisites
- Node.js (v18+ recommended)
- A local MongoDB instance or a MongoDB Atlas URI string.

### Setup Steps
1. Navigate to the project root and install all dependencies:
   ```bash
   npm run install:all
   ```
2. Navigate to `./server/` and create a `.env` file based on `.env.example`. Make sure `MONGO_URI` is correct.
3. Run the development environment for both backend and frontend simultaneously:
   ```bash
   npm run dev
   ```

## Assumptions and Trade-offs
- **State Management**: React Query was chosen over Redux to prioritize Optimistic UI updates with reduced boilerplate code. Focus is specifically kept on keeping remote server-state in perfect synchronization while creating instant subjective-feeling feedback for actions.
- **Styling**: Vanilla CSS was utilized strictly without TailwindCSS or pre-processors to maintain full control over the specific "Premium Aesthetics".
- **Database**: The Application utilizes Mongoose. In absence of a `.env` MONGO URI, it attempts connecting to `127.0.0.1:27017` assuming a local MongoDB installation.
