import { plainToInstance } from 'class-transformer'
import { Context, DefaultState } from 'koa'
import KoaRouter from 'koa-router'
import { AnalyticsService } from '../service/analytics'
import { getProviderFromEnv } from '../util'

export default function (router: KoaRouter<DefaultState, Context>) {
  const provider = getProviderFromEnv()

  router.get('analytics', async ({ restful }) => {
    restful.json([1])
  })

  router.get('analytics/pairs', async ({ restful }) => {
    restful.json([2])
  })

  router.get('analytics/transactions', async ({ restful, request }) => {
    const params = plainToInstance(
      class {
        startTime: number
        endTime: number
        page: number
      },
      request.query
    )

    const analyticsService = new AnalyticsService()

    const transactions = await analyticsService.getTransactions(
      params.startTime,
      params.endTime,
      params.page
    )

    const summary = await analyticsService.getTransactionsSummary(
      params.startTime,
      params.endTime
    )

    // Currently the two values are the same
    summary.total = transactions.total

    restful.json({ transactions, summary })
  })
}
