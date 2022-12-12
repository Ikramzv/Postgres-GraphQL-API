import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from "typeorm";
import SavesEntity from "./Save.entity";
import UserEntity from "./User.entity";

@Entity({ name: "posts" })
@ObjectType()
class PostEntity extends BaseEntity {
    @PrimaryColumn({ generated: 'uuid' , type: "uuid" })
    @Field(() => String)
    id: string

    @Column("varchar")
    @Field(() => String)
    title: string

    @Column("varchar")
    @Field(() => String)
    description: string

    @Field(() => UserEntity)
    user: UserEntity

    @ManyToOne(() => UserEntity , (user) => user.posts)
    @JoinColumn({ name: "userId" })
    @Field(() => String)
    userId: UserEntity

    @OneToMany(() => SavesEntity , (save) => save.post)
    saves: SavesEntity[]
}

export default PostEntity