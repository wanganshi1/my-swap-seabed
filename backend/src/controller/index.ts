import {Context, DefaultState} from 'koa'
import KoaRouter from 'koa-router'

export default function () {
  const router = new KoaRouter<DefaultState, Context>({ prefix: '/' })

  return router.routes()
}
