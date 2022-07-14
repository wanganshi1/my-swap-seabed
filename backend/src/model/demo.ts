import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonEntity } from './common'

@Entity()
export class Demo extends CommonEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('varchar', { length: 255, unique: true })
  title: string
}
