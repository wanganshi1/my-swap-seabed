import { jobFaucetTwitter } from './jobs'

export const startMasterJobs = async () => {
  const scene = process.env.ORBITER_SCENE

  jobFaucetTwitter()

  // dashboard
  if (['dashboard', 'all', undefined, ''].indexOf(scene) !== -1) {
  }
}

export const startWorkerJobs = async () => {
  const scene = process.env.ORBITER_SCENE

  // maker
  if (['maker', 'all', undefined, ''].indexOf(scene) !== -1) {
  }
}
