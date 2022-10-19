import axios from 'axios'
import axiosRetry from 'axios-retry'

export class CoinbaseService {
  public static usdRates: { [key: string]: string } = {}

  async cache() {
    const url = 'https://api.coinbase.com/v2/exchange-rates?currency=USD'

    const axiosClient = axios.create()
    axiosRetry(axiosClient, { retries: 3 })

    const resp = await axiosClient.get(url)

    const rates = resp.data?.data?.rates
    if (rates) {
      CoinbaseService.usdRates = rates
      this.fillTKA_TKB()
    }
  }

  private fillTKA_TKB() {
    CoinbaseService.usdRates['TKA'] = '1'
    CoinbaseService.usdRates['TKB'] = '1'
  }
}
