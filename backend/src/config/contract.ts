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
  factory: '0x07e0879afbf63ec943e58cba0d9e81385f2183f1f9aa44e32f08e877c31fdb98',
  router: '0x01a5200387983d5acb1c4a8f9be94219fb3bbb9438bb50eb70d9f5398656c78e',
}
