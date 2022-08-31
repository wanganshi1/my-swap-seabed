import { ethers } from 'ethers'

export default {
  privateKey: process.env['FAUCET_PRIVATE_KEY'],
  account: process.env['FAUCET_ACCOUNT'],
  ethAddress:
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  ethAmount: ethers.utils.parseEther('0.01'),
  aAddress:
    '0x01036f19169e2bf0c049a1588d63cd82eadd18e9c4798f6bfb962b5541fa7ee5',
  aAmount: ethers.utils.parseUnits('500', 6),
  bAddress:
    '0x030c6217597b12be57937c9743cc2fafb4e06d1f15487cd87b7fdd787b825b5b',
  bAmount: ethers.utils.parseUnits('500', 6),
}
