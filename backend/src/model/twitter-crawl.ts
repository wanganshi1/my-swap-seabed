import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import { CommonEntity } from './common'

@Entity()
export class TwitterCrawl extends CommonEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('varchar', { length: 256, unique: true })
  tweet_id: number

  @Column('varchar', { length: 256 })
  user_id: number

  @Column('varchar', { length: 256 })
  username: string

  @Column('timestamp', { default: null })
  timestamp: Date

  @Column('text')
  content: string
}
