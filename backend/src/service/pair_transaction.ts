import { AxiosInstance } from 'axios'
import { Provider } from 'starknet'
import { In, Repository } from 'typeorm'
import { PairEvent } from '../model/pair_event'
import { PairTransaction } from '../model/pair_transaction'
import { Core } from '../util/core'
import { Pair, PoolService } from './pool'
import { StarkscanService } from './starkscan'

export class PairTransactionService {
  private provider: Provider
  private axiosClient: AxiosInstance
  private repoPairEvents: Repository<PairEvent>
  private repoPairTransaction: Repository<PairTransaction>

  constructor(provider: Provider) {
    this.provider = provider
    this.axiosClient = new StarkscanService(provider).getAxiosClient()
    this.repoPairEvents = Core.db.getRepository(PairEvent)
    this.repoPairTransaction = Core.db.getRepository(PairTransaction)
  }

  async purify() {
    // const pairs = await new PoolService(this.provider).pairs()
    // if (pairs.length < 1) {
    //   return
    // }

    const pairEvents = await this.repoPairEvents.find({
      where: { key_name: In(['Swap', 'Mint', 'Burn']) , status: 0},
      order: { event_time: 'ASC' },
      take: 100,
    })

    console.warn('pairEvents:', pairEvents)

    // await Promise.all(pairs.map((pair) => this.collect(pair)))
  }
}
