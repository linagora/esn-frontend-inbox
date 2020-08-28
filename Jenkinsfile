pipeline {

  agent { 
    dockerfile {
      filename 'Dockerfile'
      dir 'test'
    }
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

    stage('Deliver Docker images') {
      when { branch 'main' }
      steps {
        echo "Delivery"
      }
    }

    stage('Deploy new version') {
      when { branch 'main' }
      steps {
        echo "Deploy"
      }
    }
  }
}
