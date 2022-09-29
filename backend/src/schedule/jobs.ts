import schedule from 'node-schedule'
import { Provider } from 'starknet'
import { FaucetService } from '../service/faucet'
import { PoolService } from '../service/pool'
import { isDevelopEnv } from '../util'
import { errorLogger } from '../util/logger'

// import { doSms } from '../sms/smsSchinese'
class MJob {
  protected rule:
    | string
    | number
    | schedule.RecurrenceRule
    | schedule.RecurrenceSpecDateRange
    | schedule.RecurrenceSpecObjLit
    | Date
  protected callback?: () => any
  protected jobName?: string

  /**
   * @param rule
   * @param callback
   * @param jobName
   */
  constructor(
    rule:
      | string
      | number
      | schedule.RecurrenceRule
      | schedule.RecurrenceSpecDateRange
      | schedule.RecurrenceSpecObjLit
      | Date,
    callback?: () => any,
    jobName?: string
  ) {
    this.rule = rule
    this.callback = callback
    this.jobName = jobName
  }

  public schedule(): schedule.Job {
    return schedule.scheduleJob(this.rule, async () => {
      try {
        this.callback && (await this.callback())
      } catch (error) {
        let message = `MJob.schedule error: ${error.message}, rule: ${this.rule}`
        if (this.jobName) {
          message += `, jobName: ${this.jobName}`
        }
        errorLogger.error(message)
      }
    })
  }
}

// Pessimism Lock Job
class MJobPessimism extends MJob {
  public schedule(): schedule.Job {
    let pessimismLock = false

    const _callback = this.callback

    this.callback = async () => {
      if (pessimismLock) {
        return
      }
      pessimismLock = true

      try {
        _callback && (await _callback())
      } catch (error) {
        throw error
      } finally {
        // Always release lock
        pessimismLock = false
      }
    }

    return super.schedule()
  }
}

export function jobFaucetTwitter() {
  const callback = async () => {
    await new FaucetService().fromTwitter()
  }

  new MJobPessimism(
    '*/10 * * * * *',
    callback,
    jobFaucetTwitter.name
  ).schedule()
}

export function jobPoolCollect() {
  const callback = async () => {
    const provider = new Provider({
      network: isDevelopEnv() ? 'goerli-alpha' : 'mainnet-alpha',
    })
    await new PoolService(provider).collect()
  }

  new MJobPessimism('*/10 * * * * *', callback, jobPoolCollect.name).schedule()
}
