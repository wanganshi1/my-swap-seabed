import { jobFaucetTwitter } from './jobs'

export const startMasterJobs = async () => {
  jobFaucetTwitter()
}

export const startWorkerJobs = async () => {
}
