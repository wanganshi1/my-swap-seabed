import { Account, Provider, ec, Abi } from 'starknet'
import { toBN, toHex } from 'starknet/dist/utils/number'
import { bnToUint256 } from 'starknet/dist/utils/uint256'
import { faucetConfig } from '../config'
import erc20 from '../config/abis/erc20.json'
import { TwitterCrawl } from '../model/twitter-crawl'
import { isAddress } from '../util'
import { Core } from '../util/core'

export class FaucetService {
  constructor() {}

  async fromTwitter() {
    console.warn(faucetConfig)
    console.warn('fromTwitter:', new Date())

    const tweets = await this.getTweets()

    await Promise.all(tweets.map((item) => this.sendTokens(item)))
  }

  private async sendTokens(tweet: TwitterCrawl) {
    const userAddress = this.getAddress(tweet.content)
    const repository = Core.db.getRepository(TwitterCrawl)

    if (!userAddress) {
      await repository.update({ tweet_id: tweet.tweet_id }, { status: 2 })
      return
    }

    try {
      await this.execute(userAddress)
      await repository.update({ tweet_id: tweet.tweet_id }, { status: 1 })
    } catch (error) {
      await repository.update({ tweet_id: tweet.tweet_id }, { status: 2 })
      console.log('error', error)
    }
  }

  private async execute(userAddress: string) {
    const account = this.getAccount()
    const { aAddress, aAmount, bAddress, bAmount, ethAddress, ethAmount } =
      faucetConfig

    const a = bnToUint256(toBN(aAmount.toString()))
    const b = bnToUint256(toBN(bAmount.toString()))
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
    ]
    await account.execute(calls, [erc20 as Abi, erc20 as Abi])

    const eth = bnToUint256(toBN(ethAmount.toString()))
    await account.execute(
      [
        {
          contractAddress: ethAddress,
          entrypoint: 'transfer',
          calldata: [userAddress, eth.low, eth.high],
        },
      ],
      [erc20 as Abi]
    )
  }

  private async getTweets() {
    return await Core.db
      .getRepository(TwitterCrawl)
      .find({ where: { status: 0 } })
  }

  private getAccount() {
    const provider = new Provider({
      network: 'goerli-alpha',
    })
    const pk = toHex(toBN(faucetConfig.privateKey!))
    const keyPair = ec.getKeyPair(pk)
    return new Account(provider, faucetConfig.account!.toLowerCase(), keyPair)
  }

  private getAddress(content: string): string | undefined {
    const reg = new RegExp(/0x[a-fA-F0-9]{63,67}/gi)
    const address = content.match(reg)?.[0]

    return isAddress(address) ? address : undefined
  }
}
