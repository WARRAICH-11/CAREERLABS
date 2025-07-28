# CAREERLABS Deployment Guide

This document provides instructions for deploying the CAREERLABS application in different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Staging Deployment](#staging-deployment)
6. [Production Deployment](#production-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Database Migrations](#database-migrations)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js v16.x or later
- MongoDB v4.4 or later
- Git
- Docker and Docker Compose (for containerized deployment)
- AWS CLI (for AWS deployment)
- Heroku CLI (for Heroku deployment)

## Environment Configuration

### Backend Environment Variables

Copy the example environment file and modify it according to your environment:

```bash
cp .env.example .env
```

Essential environment variables:

- `NODE_ENV`: Set to `development`, `test`, `staging`, or `production`
- `PORT`: The port the API will run on (default: 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token generation (min 32 characters)
- `FRONTEND_URL`: The URL of the frontend application (for CORS)

See `.env.example` for a complete list of environment variables.

### Frontend Environment Variables

The frontend uses environment-specific files:

- `.env`: Local development
- `.env.staging`: Staging environment
- `.env.production`: Production environment

The webpack configuration automatically selects the appropriate file based on the build environment.

## Local Development

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Full Stack Development

To run both frontend and backend concurrently:

```bash
npm run install-all  # Install dependencies for both frontend and backend
npm run dev          # Start both servers
```

## Docker Deployment

### Local Docker Deployment

1. Set up environment variables:

```bash
cp .env.example .env
```

2. Build and start the Docker containers:

```bash
docker-compose build
docker-compose up
```

### Production Docker Deployment

1. Build the production Docker image:

```bash
docker build -t careerlabs:latest .
```

2. Run the Docker container:

```bash
docker run -p 5000:5000 --env-file .env careerlabs:latest
```

## Staging Deployment

### Heroku Staging Deployment

1. Create a Heroku app:

```bash
heroku create careerlabs-staging
```

2. Set environment variables:

```bash
heroku config:set NODE_ENV=staging
heroku config:set MONGO_URI=<your_mongodb_uri>
heroku config:set JWT_SECRET=<your_jwt_secret>
# Set other environment variables as needed
```

3. Deploy to Heroku:

```bash
git push heroku develop:main
```

Alternatively, use the GitHub Actions CI/CD pipeline for automated deployments to staging when you push to the `develop` branch.

## Production Deployment

### AWS ECS Deployment

1. Set up an AWS ECR repository:

```bash
aws ecr create-repository --repository-name careerlabs
```

2. Build and push the Docker image:

```bash
aws ecr get-login-password --region <your_region> | docker login --username AWS --password-stdin <your_account_id>.dkr.ecr.<your_region>.amazonaws.com
docker build -t <your_account_id>.dkr.ecr.<your_region>.amazonaws.com/careerlabs:latest .
docker push <your_account_id>.dkr.ecr.<your_region>.amazonaws.com/careerlabs:latest
```

3. Create an ECS cluster, task definition, and service using the AWS Management Console or AWS CLI.

4. Update the service to deploy new versions:

```bash
aws ecs update-service --cluster careerlabs-cluster --service careerlabs-service --force-new-deployment
```

The GitHub Actions CI/CD pipeline automates these steps when you push to the `main` branch.

## CI/CD Pipeline

The CI/CD pipeline is configured using GitHub Actions and defined in `.github/workflows/ci-cd.yml`. It includes:

1. **Testing**: Runs tests for both frontend and backend
2. **Building**: Builds the frontend and prepares the backend for deployment
3. **Deployment**:
   - Deploys to Heroku staging when pushing to the `develop` branch
   - Deploys to AWS ECS production when pushing to the `main` branch

### GitHub Repository Secrets

Set up the following secrets in your GitHub repository:

- `HEROKU_API_KEY`: Your Heroku API key
- `HEROKU_EMAIL`: Your Heroku email
- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
- `AWS_REGION`: The AWS region for deployment
- `STAGING_MONGO_URI`: MongoDB connection string for staging
- `STAGING_JWT_SECRET`: JWT secret for staging
- Other environment-specific secrets

## Database Migrations

Database migrations are handled automatically through Mongoose schemas. When you update a schema, the changes will be applied when the application starts.

For major schema changes, consider using a migration script:

```bash
node backend/scripts/migrate.js
```

## Monitoring and Logging

### Health Check Endpoint

A health check endpoint is available at `/api/health` to monitor the application's status.

### Logging

Logs are output to the console and can be viewed:

- Local: In the terminal
- Heroku: Using `heroku logs --tail`
- AWS: Using CloudWatch Logs

## Troubleshooting

### Common Issues

#### MongoDB Connection Errors

- **Issue**: Unable to connect to MongoDB
  - **Solution**: 
    - Verify the MongoDB connection string
    - Check network connectivity
    - Ensure IP whitelist includes your deployment server

#### Frontend Build Issues

- **Issue**: Webpack configuration errors
  - **Solution**:
    - Check webpack.config.js for syntax errors
    - Ensure all required dependencies are installed
    - Fix proxy configuration format:
  
  ```js
  // Correct proxy format:
  proxy: [
    {
      context: ['/api'],
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false
    }
  ]
  ```

- **Issue**: Missing dependencies
  - **Solution**:
    - Run `npm install` in the frontend directory
    - Check for incompatible versions in package.json

#### Backend Server Issues

- **Issue**: Backend server not starting
  - **Solution**:
    - Check for syntax errors in server.js
    - Verify all required environment variables are set
    - Ensure port is not already in use

#### Docker Issues

- **Issue**: Docker containers not connecting to each other
  - **Solution**:
    - Use the service name for internal communication (`mongodb` instead of `localhost`)
    - Check network configuration in docker-compose.yml
    - Verify container health checks are passing

- **Issue**: Environment variables not available in containers
  - **Solution**:
    - Check environment variable definitions in docker-compose.yml
    - Use a .env file with docker-compose
    - Set environment variables directly in Dockerfile for testing

#### CI/CD Pipeline Issues

- **Issue**: GitHub Actions workflow failing
  - **Solution**:
    - Check workflow logs for specific errors
    - Verify all required secrets are set in repository settings
    - Test the build locally before pushing

### Environment-Specific Issues

#### Development Environment

- **Issue**: Hot reloading not working
  - **Solution**:
    - Check webpack-dev-server configuration
    - Verify React version compatibility
    - Restart the development server

#### Staging Environment

- **Issue**: Heroku deployment failing
  - **Solution**:
    - Check Heroku logs: `heroku logs --tail`
    - Verify Procfile configuration
    - Check environment variables in Heroku dashboard

#### Production Environment

- **Issue**: AWS ECS service not starting
  - **Solution**:
    - Check ECS service events in AWS console
    - Verify task definition and container health checks
    - Check container logs in CloudWatch

### Support

For additional help, contact the development team or file an issue in the GitHub repository. 