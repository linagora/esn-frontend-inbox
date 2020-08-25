pipeline {

  agent { 
    docker {image 'node:6-alpine' }
  }

  stages {
    stage('Install packages') {
      steps {
        sh 'npm install'
      }
    }
    stage('Run tests') {
      steps {
        sh 'npm run test'
      }
    }
  }
}
