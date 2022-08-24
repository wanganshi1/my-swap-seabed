import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonEntity } from './common'

@Entity()
export class TwitterCrawl extends CommonEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('int')
  userId: number

  @Column('varchar', { length: 256 })
  username: number

  @Column('timestamp', {
    default: () => null,
  })
  timestamp: Date

  @Column('varchar', { length: 256 })
  text: string
}
