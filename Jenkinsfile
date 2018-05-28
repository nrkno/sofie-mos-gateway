@Library('sofie-jenkins-lib') _

pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
          sofieSlackSendBuildStarted()
          dockerBuild('sofie/tv-automation-mos-gateway')
      }
    }
    stage('Deploy') {
      steps {
          mosDeploy()
      }
    }
  }
}
