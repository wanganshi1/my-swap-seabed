import { jobFaucetTwitter, jobPoolCollect } from './jobs'

export const startMasterJobs = async () => {
  jobFaucetTwitter()
  jobPoolCollect()
}

export const startWorkerJobs = async () => {}
