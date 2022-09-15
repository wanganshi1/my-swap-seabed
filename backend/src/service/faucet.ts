import BN from 'bn.js'
import { utils } from 'ethers'
import { Account, Provider, ec, Abi, number } from 'starknet'
import { BigNumberish, toBN, toHex } from 'starknet/dist/utils/number'
import { bnToUint256 } from 'starknet/dist/utils/uint256'
import { faucetConfig } from '../config'
import erc20 from '../config/abis/erc20.json'
import { TwitterCrawl } from '../model/twitter-crawl'
import { isAddress } from '../util'
import { Core } from '../util/core'
import { accessLogger, errorLogger } from '../util/logger'

export class FaucetService {
  constructor() {}

  async fromTwitter() {
    const accounts = this.getAccounts()
    if (accounts.length < 1) {
      errorLogger.error('FromTwitter failed: Miss accounts')
      return
    }

    const tweets = await Core.db.getRepository(TwitterCrawl).find({
      where: { status: 0 },
      take: accounts.length,
      order: { tweet_time: 'ASC' },
    })

    await Promise.all(
      tweets.map((item, index) => {
        return this.sendTokens(accounts[index], item)
      })
    )
  }

  private async sendTokens(account: Account, tweet: TwitterCrawl) {
    const userAddress = this.getAddress(tweet.content)
    const repository = Core.db.getRepository(TwitterCrawl)

    if (!userAddress) {
      await repository.update({ tweet_id: tweet.tweet_id }, { status: 2 })
      errorLogger.error(`Miss userAddress, tweet_id: ${tweet.tweet_id}`)
      return
    }

    try {
      await this.execute(account, userAddress)
      await repository.update({ tweet_id: tweet.tweet_id }, { status: 1 })
    } catch (error) {
      await repository.update({ tweet_id: tweet.tweet_id }, { status: 2 })
      errorLogger.error(
        `Execute fail: ${error.message}. Account: ${account.address}`
      )
    }
  }

  private async execute(account: Account, userAddress: string) {
    const { aAddress, aAmount, bAddress, bAmount, ethAddress, ethAmount } =
      faucetConfig

    const a = bnToUint256(toBN(aAmount.toString()))
    const b = bnToUint256(toBN(bAmount.toString()))
    const eth = bnToUint256(toBN(ethAmount.toString()))
    const calls = [
      {
        contractAddress: aAddress,
        entrypoint: 'transfer',
        calldata: [userAddress, a.low, a.high],
      },
      {
        contractAddress: bAddress,
        entrypoint: 'transfer',
        calldata: [userAddress, b.low, b.high],
      },
      {
        contractAddress: ethAddress,
        entrypoint: 'transfer',
        calldata: [userAddress, eth.low, eth.high],
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
