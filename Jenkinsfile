@Library('sofie-jenkins-lib') _

pipeline {
  agent any
  stages {
    stage('Version') {
      when {
        branch 'master'
      }
      steps {
        versionRelease()
      }
    }
    stage('Build') {
      steps {
        sofieSlackSendBuildStarted()
        dockerBuild('sofie/tv-automation-mos-gateway')
      }
    }
    stage('Deploy') {
      when {
        branch 'develop'
      }
      steps {
        mosDeploy()
      }
    }
  }
  post {
    failure {
      sofieSlackSendBuildFailure()
    }
    success {
      sofieSlackSendBuildSuccess()
    }
  }
}
