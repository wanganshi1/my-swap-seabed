import { Context, DefaultState } from 'koa'
import KoaRouter from 'koa-router'
import { getProviderFromEnv } from '../util'

export default function (router: KoaRouter<DefaultState, Context>) {
  const provider = getProviderFromEnv()

  router.get('analytics', async ({ restful }) => {
    restful.json([1])
  })

  router.get('analytics/pairs', async ({ restful }) => {
    restful.json([2])
  })

  router.get('analytics/transactions', async ({ restful }) => {
    restful.json([3])
  })
}
