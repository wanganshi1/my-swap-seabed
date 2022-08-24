import axios from 'axios'
import { Contract, number, Provider } from 'starknet'
import { StarknetChainId } from 'starknet/dist/constants'
import { getSelectorFromName } from 'starknet/dist/utils/hash'
import { BigNumberish, toBN, toHex } from 'starknet/dist/utils/number'
import { uint256ToBN } from 'starknet/dist/utils/uint256'
import { contractConfig } from '../config'

type Pair = {
  token0: string
  token1: string
  pairAddress: string
  totalSupply: string // hex
  decimals: number
  APR: number
}

export class PoolService {
  static _pairs: Pair[] = []

  private provider: Provider
  private factoryAddress: string
  private eventKey: string
  private voyagerOrigin: string

  constructor(provider: Provider) {
    this.provider = provider
    this.factoryAddress = contractConfig.addresses.factory
    this.eventKey = getSelectorFromName('PairCreated')

    switch (this.provider.chainId) {
      case StarknetChainId.MAINNET:
        this.voyagerOrigin = 'https://voyager.online'
        break
      case StarknetChainId.TESTNET:
      default:
        this.voyagerOrigin = 'https://goerli.voyager.online'
        break
    }
  }

  private async getPairInfo(address: string) {
    const contract = new Contract(
      contractConfig.abis.erc20 as any,
      address,
      this.provider
    )

    const { totalSupply } = await contract.totalSupply()
    const { decimals } = await contract.decimals()

    return {
      totalSupply: toHex(uint256ToBN(totalSupply)),
      decimals: toBN(decimals).toNumber(),
    }
  }

  async pairs() {
    if (PoolService._pairs.length == 0) {
      await this.collect()
    }

    return PoolService._pairs
  }

  async collect() {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
    const headers = { 'user-agent': userAgent }

    const eventsURL = `${this.voyagerOrigin}/api/events?contract=${this.factoryAddress}&ps=100&p=1`

    const resp = await axios.get(eventsURL, { headers })

    const items = resp.data?.items
    if (!items) {
      return
    }

    const _pairs: Pair[] = []
    for (const item of items) {
      const eventURL = `${this.voyagerOrigin}/api/event/${item.id}`
      const eventResp = await axios.get(eventURL, { headers })

      // filter
      if (!toBN(eventResp.data?.keys?.[0]).eq(toBN(this.eventKey))) {
        continue
      }

      const token0 = number.toHex(toBN(eventResp.data.data[0]))
      const token1 = number.toHex(toBN(eventResp.data.data[1]))
      const pairAddress = number.toHex(toBN(eventResp.data.data[2]))

      const pairInfo = await this.getPairInfo(pairAddress)

      _pairs.push({
        token0,
        token1,
        pairAddress: pairAddress,
        totalSupply: pairInfo.totalSupply,
        decimals: pairInfo.decimals,
        APR: 2,
      })
    }

    // Replace PoolService._pairs
    PoolService._pairs = _pairs
  }
}
