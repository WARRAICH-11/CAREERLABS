# CAREER LABS

A comprehensive career development and job search platform built with the MERN stack.

## Project Overview

CAREER LABS is a full-featured web application that helps users develop their careers, find job opportunities, connect with mentors, and receive personalized career recommendations.

## Features

- User authentication with JWT
- Profile management
- Career assessments with personalized recommendations
- Job listings and application tracking
- Mentorship connections
- Real-time chat with WebSockets
- File management for resumes and portfolios
- Notifications system
- Admin dashboard for data management

## Tech Stack

- **Frontend**: React, React Router, Redux, Bootstrap
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT
- **Real-time Communication**: Socket.io
- **Styling**: CSS, React-Bootstrap

## Getting Started

### Prerequisites

- Node.js (v16.x or later)
- MongoDB (v4.4 or later)
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/careerlabs.git
cd careerlabs
```

2. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your MongoDB URI and other configurations.

3. Install dependencies and start the development server:
```bash
# Install all dependencies for both frontend and backend
npm run install-all

# Start development servers for both frontend and backend
npm run dev
```

### Docker Setup

To run the application using Docker:

```bash
# Build and start containers
docker-compose up -d

# Stop containers
docker-compose down
```

## Deployment

This project includes deployment configurations for multiple environments:

- **Local Development**: Use `npm run dev`
- **Docker Deployment**: Use `docker-compose up`
- **Staging (Heroku)**: Configure with GitHub Actions
- **Production (AWS)**: Configure with GitHub Actions

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Building for Production

```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow for continuous integration and deployment:

- Runs tests for both frontend and backend
- Builds the frontend for production
- Deploys to staging on push to `develop` branch
- Deploys to production on push to `main` branch

See `.github/workflows/ci-cd.yml` for details.

## Directory Structure

```
├── backend/                # Backend Express.js API
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   └── server.js           # Server entry point
├── frontend/               # Frontend React application
│   ├── public/             # Static assets
│   └── src/                # React source code
│       ├── components/     # React components
│       ├── context/        # React context providers
│       ├── utils/          # Utility functions
│       └── index.js        # Entry point
├── .github/                # GitHub Actions workflows
├── docker-compose.yml      # Docker configuration
├── Dockerfile              # Docker build configuration
└── package.json            # Project dependencies and scripts
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 