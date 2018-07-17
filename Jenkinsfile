pipeline {
  agent none
  stages {
    stage('Build App') {
      agent {
        docker {
          image 'python:latest'
        }
      }
      steps {
        sh 'apt-get update -qy'
        sh 'pip install -r requirements.txt'
        sh 'python manage.py test'
      }
    }
  }
  environment {
    CI = 'true'
  }
}