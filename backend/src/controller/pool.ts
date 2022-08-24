import KoaRouter from 'koa-router'
import { Context, DefaultState } from 'koa'
import { PoolService } from '../service/pool'
import { Provider } from 'starknet'

export default function (router: KoaRouter<DefaultState, Context>) {
  router.get('pool/pairs', async ({ restful }) => {
    const provider = new Provider({ network: 'goerli-alpha' })
    const poolService = new PoolService(provider)
    const pairs = await poolService.pairs()

    restful.json(pairs)
  })
}
