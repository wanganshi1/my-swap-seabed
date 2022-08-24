import { Context, DefaultState } from 'koa'
import KoaRouter from 'koa-router'

import pool from './pool'

export default function () {
  const router = new KoaRouter<DefaultState, Context>({ prefix: '/' })

  pool(router)

  return router.routes()
}
