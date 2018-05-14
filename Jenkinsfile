@Library('sofie-jenkins-lib') _

pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
          dockerBuild('sofie/tv-automation-mos-gateway')
      }
    }
    stage('Deploy') {
      steps {
          testDeploy('tv-automation-mos-gateway')
      }
    }
  }
}
