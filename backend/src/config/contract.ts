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
  mainnet: {
    parirClassHash:
      '0x07b5cd6a6949cc1730f89d795f2442f6ab431ea6c9a5be00685d50f97433c5eb',
    factory:
      '0xdad44c139a476c7a17fc8141e6db680e9abc9f56fe249a105094c44382c2fd',
    router:
      '0x041fd22b238fa21cfcf5dd45a8548974d8263b3a531a60388411c5e230f97023',
  },

  goerli: {
    parirClassHash:
      '0x2b39bc3f4c1fd5bef8b7d21504c44e0da59cf27b350551b13d913da52e40d3b',
    factory:
      '0x262744f8cea943dadc8823c318eaf24d0110dee2ee8026298f49a3bc58ed74a',
    router:
      '0x2bcc885342ebbcbcd170ae6cafa8a4bed22bb993479f49806e72d96af94c965',
  },
}
