import { utils } from 'ethers'
import { toBN } from 'starknet/dist/utils/number'
import { Repository } from 'typeorm'
import { PairTransaction } from '../model/pair_transaction'
import { dateFormatNormal } from '../util'
import { Core } from '../util/core'
import { CoinbaseService } from './coinbase'
import { PoolService } from './pool'

export class AnalyticsService {
  private repoPairTransaction: Repository<PairTransaction>

  constructor() {
    this.repoPairTransaction = Core.db.getRepository(PairTransaction)
  }

  async getTransactions(startTime: number, endTime: number, page = 1) {
    const limit = 10
    page = page < 1 ? 1 : page

    // QueryBuilder
    const queryBuilder = this.repoPairTransaction.createQueryBuilder()
    if (startTime > 0) {
      queryBuilder.andWhere('event_time >= :startTimeFormat', {
        startTimeFormat: dateFormatNormal(startTime * 1000),
      })
    }
    if (endTime > 0) {
      queryBuilder.andWhere('event_time <= :endTimeFormat', {
        endTimeFormat: dateFormatNormal(endTime * 1000),
      })
    }
    queryBuilder.addOrderBy('event_time', 'DESC').addOrderBy('id', 'DESC')
    queryBuilder.limit(limit).offset(limit * (page - 1))

    const [transactions, total] = await queryBuilder.getManyAndCount()

    for (const item of transactions) {
      item['token0'] = undefined
      item['token1'] = undefined
      item['amount0_human'] = ''
      item['amount1_human'] = ''
      item['fee_usd'] = ''

      const pair = this.getTargetPair(item.pair_address)
      if (pair) {
        item['token0'] = pair.token0
        item['token1'] = pair.token1

        item['amount0_human'] = utils.formatUnits(
          item.amount0,
          pair.token0.decimals
        )
        item['amount1_human'] = utils.formatUnits(
          item.amount1,
          pair.token1.decimals
        )

        if (toBN(item.fee).gtn(0)) {
          const coinbaseService = new CoinbaseService()
          const [_decimals, _symbol] =
            item.swap_reverse === 0
              ? [pair.token0.decimals, pair.token0.symbol]
              : [pair.token1.decimals, pair.token1.symbol]
          item['fee_usd'] = await coinbaseService.exchangeToUsd(
            item.fee,
            _decimals,
            _symbol
          )
        }
      }
    }

    return { transactions, total, limit, page }
  }

  async getTransactionsSummary(startTime: number, endTime: number) {
    const swapFees = await this.getPairSwapFees(startTime, endTime)

    const profits: {
      address: string
      name: string
      symbol: string
      decimals: number
      amount: string
      amountHuman: string
    }[] = []
    for (const item of swapFees) {
      const pair = this.getTargetPair(item.pair_address)
      if (!pair) {
        continue
      }

      const feeToken = item.swap_reverse === 0 ? pair.token0 : pair.token1
      const targetProfit = profits.find(
        (profit) => profit.address == feeToken.address
      )
      const amount = toBN(item.sum_fee + '')

      if (targetProfit) {
        targetProfit.amount = amount.add(toBN(targetProfit.amount)) + ''
        targetProfit.amountHuman = utils.formatUnits(
          targetProfit.amount,
          feeToken.decimals
        )
      } else {
        const amountHuman = utils.formatUnits(amount + '', feeToken.decimals)
        profits.push({ ...feeToken, amount: amount + '', amountHuman })
      }
    }

    return { total: 0, profits }
  }

  private getTargetPair(pairAddress: string) {
    return PoolService.pairs.find((item) => item.pairAddress == pairAddress)
  }

  private async getPairSwapFees(startTime: number, endTime: number) {
    // QueryBuilder
    const queryBuilder = this.repoPairTransaction.createQueryBuilder()
    queryBuilder.select('pair_address, swap_reverse, SUM(fee) as sum_fee')
    queryBuilder.where('key_name = :key_name', { key_name: 'Swap' })
    if (startTime > 0) {
      queryBuilder.andWhere('event_time >= :startTimeFormat', {
        startTimeFormat: dateFormatNormal(startTime * 1000),
      })
    }
    if (endTime > 0) {
      queryBuilder.andWhere('event_time <= :endTimeFormat', {
        endTimeFormat: dateFormatNormal(endTime * 1000),
      })
    }
    queryBuilder.addGroupBy('pair_address').addGroupBy('swap_reverse')

    return await queryBuilder.getRawMany<{
      pair_address: string
      swap_reverse: number
      sum_fee: number
    }>()
  }
}
