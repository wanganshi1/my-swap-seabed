import axios, { AxiosInstance } from 'axios'
import axiosRetry from 'axios-retry'
import { AsyncContractFunction, Contract, number, Provider } from 'starknet'
import { StarknetChainId } from 'starknet/dist/constants'
import { getSelectorFromName } from 'starknet/dist/utils/hash'
import { toBN, toHex } from 'starknet/dist/utils/number'
import { uint256ToBN } from 'starknet/dist/utils/uint256'
import { contractConfig } from '../config'
import { sleep } from '../util'

export type Pair = {
  token0: { address: string; name: string; symbol: string; decimals: number }
  token1: { address: string; name: string; symbol: string; decimals: number }
  pairAddress: string
  decimals: number
  reserve0: string // hex
  reserve1: string // hex
  totalSupply: string // hex
  APR: string
}

export class PoolService {
  public static pairs: Pair[] = []

  private provider: Provider
  private factoryAddress: string
  private eventKey: string
  private axiosClient: AxiosInstance

  constructor(provider: Provider) {
    this.provider = provider
    this.eventKey = getSelectorFromName('PairCreated')

    switch (this.provider.chainId) {
      case StarknetChainId.MAINNET:
        this.factoryAddress = contractConfig.addresses.mainnet.factory
        this.axiosClient = axios.create({ baseURL: 'https://voyager.online' })
        break
      case StarknetChainId.TESTNET:
      default:
        this.factoryAddress = contractConfig.addresses.goerli.factory
        this.axiosClient = axios.create({
          baseURL: 'https://goerli.voyager.online',
        })
        break
    }
    axiosRetry(this.axiosClient, { retries: 3 })
  }

  private async contractCallWithRetry(
    func: AsyncContractFunction,
    args: any[] = [],
    retryTotal = 0
  ) {
    try {
      return await func(args)
    } catch (err) {
      // Retry "Too Many Requests" error
      const retry = /(Too Many Requests)/gi.test(err.message)
      if (retry) {
        retryTotal += 1

        // Exponential Avoidance
        const ms = parseInt(retryTotal * retryTotal * 200 + '')
        await sleep(ms <= 5000 ? ms : 5000) // max: 5000ms

        return await this.contractCallWithRetry(func, args, retryTotal)
      }

      throw err
    }
  }

  private async getErc20Info(address: string) {
    const contract = new Contract(
      contractConfig.abis.erc20 as any,
      address,
      this.provider
    )

    const [{ name }, { symbol }, { decimals }] = await Promise.all([
      this.contractCallWithRetry(contract.name),
      this.contractCallWithRetry(contract.symbol),
      this.contractCallWithRetry(contract.decimals),
    ])

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

    const [{ totalSupply }, { decimals }, { reserve0, reserve1 }] =
      await Promise.all([
        this.contractCallWithRetry(contract.totalSupply),
        this.contractCallWithRetry(contract.decimals),
        this.contractCallWithRetry(contract.getReserves),
      ])

    return {
      totalSupply: toHex(uint256ToBN(totalSupply)),
      decimals: toBN(decimals).toNumber(),
      reserve0: toHex(reserve0),
      reserve1: toHex(reserve1),
    }
  }

  async collect() {
    const userAgent =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36'
    const headers = { 'user-agent': userAgent }

    const resp = await this.axiosClient.get(
      `/api/events?contract=${this.factoryAddress}&ps=100&p=1`,
      { headers }
    )

    const items = resp.data?.items
    if (!items) {
      return
    }

    const _pairs: Pair[] = []
    for (const item of items) {
      const eventResp = await this.axiosClient.get(`/api/event/${item.id}`, {
        headers,
      })

      // filter
      if (!toBN(eventResp.data?.keys?.[0]).eq(toBN(this.eventKey))) {
        continue
      }

      const token0 = number.toHex(toBN(eventResp.data.data[0]))
      const token1 = number.toHex(toBN(eventResp.data.data[1]))
      const pairAddress = number.toHex(toBN(eventResp.data.data[2]))

      const [token0Info, token1Info, pairInfo] = await Promise.all([
        this.getErc20Info(token0),
        this.getErc20Info(token1),
        this.getPairInfo(pairAddress),
      ])

      // Goerli mock APR
      const APR = Math.sqrt(parseInt('0x' + pairAddress.slice(-2), 16)).toFixed(
        0
      )

      _pairs.push({
        token0: { address: token0, ...token0Info },
        token1: { address: token1, ...token1Info },
        pairAddress: pairAddress,
        ...pairInfo,
        APR,
      })
    }

    // Replace PoolService._pairs
    PoolService.pairs = _pairs
  }
}
