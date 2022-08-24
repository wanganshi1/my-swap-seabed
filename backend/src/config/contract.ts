import abiErc20 from './abis/erc20.json'
import abil0kFactory from './abis/l0k_factory.json'
import abil0kPair from './abis/l0k_pair.json'
import abil0kRouter from './abis/l0k_router.json'

export const abis = {
  erc20: abiErc20,
  l0kFactory: abil0kFactory,
  l0kPair: abil0kPair,
  l0kRouter: abil0kRouter,
}

export const addresses = {
  parirClassHash:
    '0x78062101eb540ba039dc779bbf908e98b64efb4439bc9abd731e1156abd12cd',
  factory: '0x007f1e072e1681c316acdc3a3be69be0a8bb02e485c5a54c8113f7804d76d7db',
  router: '0x025e0fc6599df886875411e3f1e712a969650e48b634b7cbb6399ef8d1a38359',
}
