## Introduction
This action automates the deployment process for your project to Heroku. It works by executing commands in your shell via NodeJS.

## Getting Started

### Prerequisites
- A `Procfile` or `Dockerfile` in your project.
- A GitHub repository with a `.github` folder.
- A Heroku account and API key.

### Create Workflow
1. Create a `.github` folder in your repository.
2. Inside `.github`, create a `workflows` folder.
3. Inside `workflows`, create a file named `main.yml` with the following content:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: 5hojib/heroku-deploy-action@v2 # This action
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "YOUR APP's NAME" # Must be unique in Heroku
          heroku_email: "YOUR EMAIL"
```

## Options

### Required Options

- **`heroku_api_key`**: 
  - *Description*: Your Heroku API key (stored as a GitHub secret).
  - *Example*: `${{ secrets.HEROKU_API_KEY }}`

- **`heroku_app_name`**: 
  - *Description*: Unique name for your Heroku app.
  - *Example*: `"your-app-name"`

- **`heroku_email`**: 
  - *Description*: Your Heroku email address.
  - *Example*: `"your_email@example.com"`

### Optional Options

- **Build Configuration**:
  - **`buildpack`**: 
    - *Description*: URL of a custom buildpack for your project.
    - *Example*: `"https://github.com/heroku/heroku-buildpack-ruby"`
  - **`branch`**: 
    - *Description*: Branch to deploy (defaults to HEAD).
    - *Example*: `"dev"`, `"staging"`
  - **`dontautocreate`**: 
    - *Description*: Set to true to prevent automatic Heroku app creation.
    - *Example*: `"true"`
  - **`dontuseforce`**: 
    - *Description*: Set to true to skip forced branch switching on Heroku.
    - *Example*: `"true"`

- **Docker Options**:
  - **`usedocker`**: 
    - *Description*: Deploy using a Dockerfile.
    - *Example*: `"true"`
  - **`docker_heroku_process_type`**: 
    - *Description*: Type of Heroku process (web, worker, etc.) (requires `usedocker`).
    - *Example*: `"web"`, `"worker"`
  - **`docker_build_args`**: 
    - *Description*: List of arguments to pass to the Docker build (requires `usedocker`).
    - *Example*: `"NODE_ENV=production"`
  
- **Application Structure**:
  - **`appdir`**: 
    - *Description*: Path to your application directory within the project (for subdirectories).
    - *Example*: `"api"`
  
- **Health Check Options**:
  - **`healthcheck`**: 
    - *Description*: URL to a health check endpoint (checks for a 200 response).
    - *Example*: `"https://yourapp.com/health"`
  - **`checkstring`**: 
    - *Description*: Value to check for in the health check response.
    - *Example*: `"ok"`
  - **`delay`**: 
    - *Description*: Time (in seconds) to wait before performing health check (defaults to 0).
    - *Example*: `"5"`
  - **`rollbackonhealthcheckfailed`**: 
    - *Description*: Set to true to rollback on a failed health check.
    - *Example*: `"true"`

- **Other Options**:
  - **`procfile`**: 
    - *Description*: Contents of the Procfile to save and deploy.
    - *Example*: `"web: npm start"`
  - **`env_file`**: 
    - *Description*: Path to an environment variable file (relative to `appdir`).
    - *Example*: `".env"`
  - **`justlogin`**: 
    - *Description*: Set to true to only login to Heroku (no deployment).
    - *Example*: `"true"`
  - **`region`**: 
    - *Description*: Heroku region for app deployment.
    - *Example*: `"us"`, `"eu"`
  - **`stack`**:
    - *Description*: The Heroku stack to use for this app.
    - *Example*: `"heroku-20"`

  - **`team`**:
    - *Description*: The Heroku team to assign this app to (for Heroku Enterprise users).
    - *Example*: `"your-team-name"`

