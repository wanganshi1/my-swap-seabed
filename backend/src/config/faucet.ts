import { ethers } from 'ethers'

export default {
  privateKey: process.env['FAUCET_PRIVATE_KEY'],
  account: process.env['FAUCET_ACCOUNT'],
  ethAddress:
    '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  ethAmount: ethers.utils.parseEther('0.01'),
  aAddress:
    '0x02e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
  aAmount: ethers.utils.parseUnits('500', 6),
  bAddress:
    '0x0250a29c8cd4d07a4db0516798fe86225e362439e769c9a0e1640d4a8ec12883',
  bAmount: ethers.utils.parseUnits('500', 6),
}
