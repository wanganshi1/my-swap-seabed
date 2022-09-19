import { isDevelopEnv } from '../util'
import { jobFaucetTwitter, jobPoolCollect } from './jobs'

export const startMasterJobs = async () => {
  // Only develop env
  if (isDevelopEnv()) jobFaucetTwitter()

  jobPoolCollect()
}

export const startWorkerJobs = async () => {}
