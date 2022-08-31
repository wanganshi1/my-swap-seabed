import { ethers } from 'ethers'

export default {
  privateKey: process.env['FAUCET_PRIVATE_KEY'],
  account: process.env['FAUCET_ACCOUNT'],
  ethAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  ethAmount: ethers.utils.parseEther('0.01'),
  aAddress:
    '0x021cd6f82b7a863d8b9805d391d942fe50179dc41f2dcd1620d1ad7c4bb8bab9',
  aAmount: ethers.utils.parseEther('500'),
  bAddress:
    '0x002e6249b9e54016496a3e618a87537afeb6451105fb645de38b340d1faba527',
  bAmount: ethers.utils.parseEther('500'),
}
