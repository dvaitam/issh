# ISSH - Web SSH Client

## Overview
ISSH is a Node.js-based Web SSH Client that provides a browser-based interface for connecting to SSH servers. It allows users to interact with remote servers directly from their web browser using a terminal emulator. Additionally, it integrates with AI model providers for automation tasks and job management, likely used within a Jenkins CI/CD pipeline.

## Features
- **Web-based SSH Terminal**: Connect to SSH servers using a browser with support for password and private key authentication.
- **Profile Management**: Save and manage SSH connection profiles for quick access.
- **AI Integration**: Interface with various AI providers (e.g., OpenAI, Azure, Gemini, etc.) to load models and run commands or scripts.
- **Job Management**: Create and track jobs, possibly for automation or background tasks.
- **Responsive Design**: User interface adapts to different screen sizes for better usability on mobile and desktop devices.

## Technical Details
- **Backend**: Built with Node.js using Express for serving the application and Socket.IO for real-time communication between the client and server.
- **Frontend**: Utilizes xterm.js for terminal emulation in the browser, with a custom UI for connection settings and job management.
- **SSH Connectivity**: Leverages the ssh2 library to establish SSH connections from the server to remote hosts.
- **API Proxy**: Includes a proxy endpoint to fetch AI models from external services like chat.manchik.co.uk.

## Contents
- **Jenkinsfile**: Configuration for Jenkins pipeline integration.
- **index.js**: Main application script handling server-side logic, SSH connections, and API endpoints.
- **jobs.json**: Configuration or data file for storing job information.
- **public/**: Directory for static frontend assets, including the main index.html for the web interface.

## Getting Started
1. **Prerequisites**: Ensure Node.js and npm are installed on your system.
2. **Clone Repository**: Clone this repository to your local machine or server.
3. **Install Dependencies**: Navigate to the project directory and run `npm install`.
4. **Start the Application**: Launch the server with `node index.js`. By default, it listens on port 3001 (configurable via the PORT environment variable).
5. **Access the Web Interface**: Open a web browser and navigate to `http://localhost:3001` (or the configured port).
6. **Connect to SSH Server**: Fill in the connection details (host, port, username, and authentication method) and click "Connect" to start a terminal session.

## Usage
- **SSH Connections**: Enter the target server details and choose between password or private key authentication. Save frequently used configurations as profiles.
- **AI and Automation**: Use the sidebar to interact with AI models for running commands or scripts. Select a provider, input an API key, load available models, and submit tasks.
- **Job Management**: Track background jobs or automation tasks through the provided interface.

## Additional Information
This README provides a high-level overview of ISSH. For more detailed documentation on specific features, customization, or deployment in a production environment, please update this file or add additional documentation as needed.

## Note
Ensure proper security measures are in place when deploying this application, as it handles sensitive information like SSH credentials and API keys.
