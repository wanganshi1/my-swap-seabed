import axios from 'axios'
import { Contract, number, Provider } from 'starknet'
import { StarknetChainId } from 'starknet/dist/constants'
import { getSelectorFromName } from 'starknet/dist/utils/hash'
import { toBN, toHex } from 'starknet/dist/utils/number'
import { uint256ToBN } from 'starknet/dist/utils/uint256'
import { contractConfig } from '../config'

type Pair = {
  token0: { address: string; name: string; symbol: string; decimals: number }
  token1: { address: string; name: string; symbol: string; decimals: number }
  pairAddress: string
  totalSupply: string // hex
  decimals: number
  APR: string
}

export class PoolService {
  static _pairs: Pair[] = []

  private provider: Provider
  private factoryAddress: string
  private eventKey: string
  private voyagerOrigin: string

  constructor(provider: Provider) {
    this.provider = provider
    this.eventKey = getSelectorFromName('PairCreated')

    switch (this.provider.chainId) {
      case StarknetChainId.MAINNET:
        this.factoryAddress = contractConfig.addresses.mainnet.factory
        this.voyagerOrigin = 'https://voyager.online'
        break
      case StarknetChainId.TESTNET:
      default:
        this.factoryAddress = contractConfig.addresses.goerli.factory
        this.voyagerOrigin = 'https://goerli.voyager.online'
        break
    }
  }

  private async getErc20Info(address: string) {
    const contract = new Contract(
      contractConfig.abis.erc20 as any,
      address,
      this.provider
    )

    const { name } = await contract.name()
    const { symbol } = await contract.symbol()
    const { decimals } = await contract.decimals()

    return {
      name: toBN(name).toBuffer().toString('utf-8'),
      symbol: toBN(symbol).toBuffer().toString('utf-8'),
      decimals: toBN(decimals).toNumber(),
    }
  }

  private async getPairInfo(address: string) {
    const contract = new Contract(
      contractConfig.abis.l0kPair as any,
      address,
      this.provider
    )

    const { totalSupply } = await contract.totalSupply()
    const { decimals } = await contract.decimals()
    const { reserve0, reserve1 } = await contract.getReserves()

    return {
      totalSupply: toHex(uint256ToBN(totalSupply)),
      decimals: toBN(decimals).toNumber(),
      reserve0: toHex(reserve0),
      reserve1: toHex(reserve1),
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

      const token0Info = await this.getErc20Info(token0)
      const token1Info = await this.getErc20Info(token1)

      const pairInfo = await this.getPairInfo(pairAddress)

      // Goerli mock APR
      const APR = Math.sqrt(parseInt('0x' + pairAddress.slice(-2), 16)).toFixed(0)

      _pairs.push({
        token0: { address: token0, ...token0Info },
        token1: { address: token1, ...token1Info },
        pairAddress: pairAddress,
        ...pairInfo,
        APR,
      })
    }

    // Replace PoolService._pairs
    PoolService._pairs = _pairs
  }
}
