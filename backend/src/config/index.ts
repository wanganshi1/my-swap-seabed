import path from 'path'
import * as dotenv from 'dotenv'
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') })

import { ListenOptions } from 'net'
import * as logConfig from './log'
import * as ormConfig from './orm'
import networkConfig from './network'

const appConfig = {
  options: <ListenOptions>{
    port: process.env.APP_OPTIONS_PORT || 3011,
    host: process.env.APP_OPTIONS_HOST || '0.0.0.0',
  },
}

const privateKey = process.env.PRIVATE_KEY || ''

export { appConfig, ormConfig, logConfig, networkConfig, privateKey }
