import { AxiosInstance } from 'axios'
import { Provider } from 'starknet'
import { uint256ToBN } from 'starknet/dist/utils/uint256'
import { In, Repository } from 'typeorm'
import { PairEvent } from '../model/pair_event'
import { PairTransaction } from '../model/pair_transaction'
import { Core } from '../util/core'
import { errorLogger } from '../util/logger'
import { StarkscanService } from './starkscan'

const TRANSACTION_FEE_RATIO = 3

export class PairTransactionService {
  private provider: Provider
  private axiosClient: AxiosInstance
  private repoPairEvent: Repository<PairEvent>
  private repoPairTransaction: Repository<PairTransaction>

  constructor(provider: Provider) {
    this.provider = provider
    this.axiosClient = new StarkscanService(this.provider).getAxiosClient()
    this.repoPairEvent = Core.db.getRepository(PairEvent)
    this.repoPairTransaction = Core.db.getRepository(PairTransaction)
  }

  async purify() {
    const pairEvents = await this.repoPairEvent.find({
      where: { key_name: In(['Swap', 'Mint', 'Burn']), status: In([0, 2]) },
      order: { event_time: 'ASC' },
      take: 20,
    })

    await Promise.all(pairEvents.map(this.purifyOne.bind(this)))
  }

  private async purifyOne(pairEvent: PairEvent) {
    try {
      const pairTransaction = new PairTransaction()
      pairTransaction.pair_address = pairEvent.pair_address
      pairTransaction.event_id = pairEvent.event_id
      pairTransaction.transaction_hash = pairEvent.transaction_hash
      pairTransaction.key_name = pairEvent.key_name
      pairTransaction.event_time = pairEvent.event_time

      // Account address
      pairTransaction.account_address = await this.getAccountAddress(pairEvent)

      switch (pairEvent.key_name) {
        case 'Swap':
          await this.eventSwap(pairEvent, pairTransaction)
          break
        case 'Mint':
          await this.eventMint(pairEvent, pairTransaction)
          break
        case 'Burn':
          await this.eventBurn(pairEvent, pairTransaction)
          break
      }

      await this.updateOrInsert(pairTransaction)

      await this.pairEventPurified(pairEvent)
    } catch (err) {
      errorLogger.error(
        'PurifyOne fail:',
        err.message,
        ', transaction_hash: ',
        pairEvent.transaction_hash
      )
      await this.pairEventPurifyFailed(pairEvent)
    }
  }

  private async getAccountAddress(pairEvent: PairEvent) {
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
    const contract_address = (resp.data?.data?.transaction?.contract_address ||
      '') as string
    if (!contract_address) {
      errorLogger.error(
        `Response miss contract_address. transaction_hash: ${
          pairEvent.transaction_hash
        }. Response: ${JSON.stringify(resp)}`
      )
    }

    return contract_address
  }

  // Swap
  private async eventSwap(
    pairEvent: PairEvent,
    pairTransaction: PairTransaction
  ) {
    const eventData = JSON.parse(pairEvent.event_data)
    if (!eventData || eventData.length != 10) {
      throw `EventSwap: invalid data, transaction_hash: ${pairEvent.transaction_hash}`
    }

    const amount0In = uint256ToBN({ low: eventData[1], high: eventData[2] })
    const amount1In = uint256ToBN({ low: eventData[3], high: eventData[4] })
    const amount0Out = uint256ToBN({ low: eventData[5], high: eventData[6] })
    const amount1Out = uint256ToBN({ low: eventData[7], high: eventData[8] })

    if (amount0In.gtn(0)) {
      pairTransaction.amount0 = amount0In.toString()
      pairTransaction.amount1 = amount1Out.toString()
      pairTransaction.swap_reverse = 0
      pairTransaction.fee = amount0In
        .muln(TRANSACTION_FEE_RATIO)
        .divn(1000)
        .toString()
    } else {
      pairTransaction.amount0 = amount0Out.toString()
      pairTransaction.amount1 = amount1In.toString()
      pairTransaction.swap_reverse = 1
      pairTransaction.fee = amount1In
        .muln(TRANSACTION_FEE_RATIO)
        .divn(1000)
        .toString()
    }
  }

  // Add liquidity
  private async eventMint(
    pairEvent: PairEvent,
    pairTransaction: PairTransaction
  ) {
    const eventData = JSON.parse(pairEvent.event_data)
    if (!eventData || eventData.length != 5) {
      throw `EventMint: invalid data, transaction_hash: ${pairEvent.transaction_hash}`
    }

    const amount0 = uint256ToBN({ low: eventData[1], high: eventData[2] })
    const amount1 = uint256ToBN({ low: eventData[3], high: eventData[4] })

    pairTransaction.amount0 = amount0.toString()
    pairTransaction.amount1 = amount1.toString()
  }

  // Remove liquidity
  private async eventBurn(
    pairEvent: PairEvent,
    pairTransaction: PairTransaction
  ) {
    const eventData = JSON.parse(pairEvent.event_data)
    if (!eventData || eventData.length != 6) {
      throw `EventBurn: invalid data, transaction_hash: ${pairEvent.transaction_hash}`
    }

    const amount0 = uint256ToBN({ low: eventData[1], high: eventData[2] })
    const amount1 = uint256ToBN({ low: eventData[3], high: eventData[4] })

    pairTransaction.amount0 = amount0.toString()
    pairTransaction.amount1 = amount1.toString()
  }

  private async updateOrInsert(pairTransaction: PairTransaction) {
    const one = await this.repoPairTransaction.findOne({
      select: ['id'],
      where: { event_id: pairTransaction.event_id },
    })

    if (one?.id) {
      await this.repoPairTransaction.update({ id: one.id }, pairTransaction)
    } else {
      await this.repoPairTransaction.save(pairTransaction)
    }
  }

  private async pairEventPurified(pairEvent: PairEvent) {
    return await this.repoPairEvent.update(
      {
        id: pairEvent.id,
      },
      { status: 1 }
    )
  }

  private async pairEventPurifyFailed(pairEvent: PairEvent) {
    return await this.repoPairEvent.update(
      {
        id: pairEvent.id,
      },
      { status: 2 }
    )
  }
}
