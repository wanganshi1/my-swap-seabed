import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonEntity } from './common'

@Entity()
export class PairTransaction extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number

  @Column('varchar', { length: 256 })
  pair_address: string

  @Column('varchar', { length: 256 })
  transaction_hash: string

  @Column('varchar', { length: 256 })
  key_name: string

  @Column('varchar', { length: 256 })
  account_address: string

  @Column('datetime', { precision: 6, default: null })
  event_time: Date

  @Column('varchar', { length: 256 })
  token0_amount: string

  @Column('varchar', { length: 256 })
  token1_amount: string

  @Column('varchar', { length: 256 })
  token0_fee: string

  @Column('varchar', { length: 256 })
  token1_fee: string
}
