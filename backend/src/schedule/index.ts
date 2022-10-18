import { Provider } from 'starknet'
import { isDevelopEnv } from '../util'
import {
  jobFaucetTwitter,
  jobPairEventStartWork,
  jobPairTransactionPurify,
  jobPoolCollect,
} from './jobs'

export const startMasterJobs = async () => {
  // Only develop env
  if (isDevelopEnv()) jobFaucetTwitter()

  const provider = new Provider({
    network: isDevelopEnv() ? 'goerli-alpha' : 'mainnet-alpha',
  })

  jobPoolCollect(provider)

  jobPairEventStartWork(provider)
  jobPairTransactionPurify(provider)
}

export const startWorkerJobs = async () => {}
