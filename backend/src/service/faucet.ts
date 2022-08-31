import { faucetConfig } from '../config'

export class FaucetService {
  constructor() {}

  async fromTwitter() {
    console.warn(faucetConfig)

    console.warn('fromTwitter:', new Date())
  }
}
