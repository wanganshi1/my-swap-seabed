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
      where: { key_name: In(['Swap', 'Mint', 'Burn']), status: 0 },
      order: { event_time: 'ASC' },
      take: 100,
    })

    await this.getAccountAddress(pairEvents[0])

    // await Promise.all(pairs.map((pair) => this.collect(pair)))
  }

  async getAccountAddress(pairEvent: PairEvent) {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
    const headers = { 'user-agent': userAgent }

    const postData = {
      operationName: 'transaction',
      variables: {
        input: {
          transaction_hash: pairEvent.transaction_hash,
        },
      },
      query:
        'query transaction($input: TransactionInput!) {\n  transaction(input: $input) {\n    transaction_hash\n    contract_address\n}\n}',
    }

    const resp = await this.axiosClient.post('/graphql', postData, { headers })

    console.warn('resp.data?.data?.transaction:', resp.data?.data?.transaction)
  }
}
