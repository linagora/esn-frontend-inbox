pipeline {

  agent { 
    docker {image 'node:10-buster' }
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
