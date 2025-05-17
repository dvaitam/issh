pipeline {
  agent any
environment {
        NVM_DIR = "/var/lib/jenkins/.nvm"
        // Prepend Node bin directory to PATH
        PATH = "/var/lib/jenkins/.nvm/versions/node/v22.15.0/bin:${env.PATH}"
        GIT_REF = sh(script: '''
            if [ -n "$GIT_REF" ]; then
                echo "$GIT_REF" | sed 's#refs/tags/##' | sed 's#refs/heads/##'
            elif [ -n "$GIT_COMMIT" ]; then
                echo "$GIT_COMMIT"
            else
                echo "main"
            fi
        ''', returnStdout: true).trim()
    }
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
