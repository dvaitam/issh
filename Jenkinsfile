pipeline {
  agent any
  stages {
    stage('Deploy') {
      steps {
        dir('/var/lib/jenkins/issh') {
          // Pull the latest code
          sh 'git pull'
          // Install/update dependencies
          sh 'npm install'
          // Restart the application via PM2
          sh 'pm2 restart index.js'
        }
      }
    }
  }
}