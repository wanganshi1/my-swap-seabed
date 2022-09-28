import { utils } from 'ethers'
import { Abi, Account, ec, Provider } from 'starknet'
import { toBN, toHex } from 'starknet/dist/utils/number'
import { bnToUint256 } from 'starknet/dist/utils/uint256'
import { faucetConfig } from '../config'
import erc20 from '../config/abis/erc20.json'
import { TwitterCrawl } from '../model/twitter-crawl'
import { isAddress, sleep } from '../util'
import { Core } from '../util/core'
import { accessLogger, errorLogger } from '../util/logger'

export class FaucetService {
  private accountWorking: { [key: string]: boolean } = {}

  constructor() {}

  async fromTwitter() {
    const accounts = this.getAccounts()
    if (accounts.length < 1) {
      errorLogger.error('FromTwitter failed: Miss accounts')
      return
    }

    const tweets = await Core.db.getRepository(TwitterCrawl).find({
      where: { status: 0 },
      take: 200,
      order: { tweet_time: 'ASC' },
    })

    for (const tweet of tweets) {
      // Get no working account(If not please wait)
      let noWorkingAccount: Account | undefined
      while (true) {
        noWorkingAccount = accounts.find(
          (item) => this.accountWorking[item.address] !== true
        )
        if (noWorkingAccount) {
          break
        } else {
          await sleep(1000)
        }
      }

      this.sendTokens(noWorkingAccount, tweet)

      // Reduce "Too Many Requests" prompts
      await sleep(2000)
    }
  }

  private async sendTokens(account: Account, tweet: TwitterCrawl) {
    const recipient = this.getAddress(tweet.content)
    const repository = Core.db.getRepository(TwitterCrawl)

    if (recipient) {
      await repository.update({ tweet_id: tweet.tweet_id }, { recipient })
    } else {
      await repository.update({ tweet_id: tweet.tweet_id }, { status: 2 })
      errorLogger.error(`Miss recipient, tweet_id: ${tweet.tweet_id}`)
      return
    }

    // Set account working
    this.accountWorking[account.address] = true

    try {
      await this.execute(account, recipient)
      await repository.update({ tweet_id: tweet.tweet_id }, { status: 1 })
    } catch (error) {
      // Retry "Too Many Requests" and "nonce invalid" errors
      const retry = /(Too Many Requests|nonce invalid)/gi.test(error.message)

      if (!retry) {
        await repository.update({ tweet_id: tweet.tweet_id }, { status: 2 })
        errorLogger.error(
          `Execute fail: ${error.message}. Account: ${account.address}`
        )
      }
    } finally {
      // Set account no working
      this.accountWorking[account.address] = false
    }
  }

  private async execute(account: Account, recipient: string) {
    const { aAddress, aAmount, bAddress, bAmount, ethAddress, ethAmount } =
      faucetConfig

    const a = bnToUint256(toBN(aAmount.toString()))
    const b = bnToUint256(toBN(bAmount.toString()))
    const eth = bnToUint256(toBN(ethAmount.toString()))
    const calls = [
      {
        contractAddress: aAddress,
        entrypoint: 'transfer',
        calldata: [recipient, a.low, a.high],
      },
      {
        contractAddress: bAddress,
        entrypoint: 'transfer',
        calldata: [recipient, b.low, b.high],
      },
      {
        contractAddress: ethAddress,
        entrypoint: 'transfer',
        calldata: [recipient, eth.low, eth.high],
      },
    ]
    const faucetResp = await account.execute(
      calls,
      [erc20 as Abi, erc20 as Abi, erc20 as Abi],
      { maxFee: utils.parseEther('0.01') + '' }
    )

    accessLogger.info('Faucet transaction_hash:', faucetResp.transaction_hash)
    await account.waitForTransaction(faucetResp.transaction_hash)
    accessLogger.info('Transaction_hash fauceted:', faucetResp.transaction_hash)
  }

  private getAccounts() {
    const provider = new Provider({
      network: 'goerli-alpha',
    })

    const accounts: Account[] = []

    for (const i in faucetConfig.privateKeys) {
      const privateKey = faucetConfig.privateKeys[i]
      const address = faucetConfig.accounts[i]
      if (!privateKey || !address) {
        continue
      }

      const pk = toHex(toBN(privateKey))
      const keyPair = ec.getKeyPair(pk)
      accounts.push(new Account(provider, address.toLowerCase(), keyPair))
    }
    return accounts
  }

  private getAddress(content: string): string | undefined {
    const reg = new RegExp(/0x[a-fA-F0-9]{61,66}/gi)
    const address = content.match(reg)?.[0]

    return isAddress(address) ? address : undefined
  }
}
