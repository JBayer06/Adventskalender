import * as bcrypt from "bcryptjs";
import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from "typeorm";
import { TaskSolution } from "./TaskSolution";

@Entity()
@Unique(["nickname"])
export class User {
    @PrimaryGeneratedColumn("uuid")
    public id: string;

    @Column()
    public nickname: string;

    @Column()
    public realname: string;

    @Column()
    public grade: string;

    @Column()
    public email: string;

    @Column({ default: false })
    public isAdmin: boolean;

    @Column({ select: false })
    public password: string;

    @Column({ select: false, nullable: true })
    public passwordResetToken: string;

    @Column()
    @CreateDateColumn()
    public createdAt: Date;

    @Column()
    @UpdateDateColumn()
    public updatedAt: Date;

    @OneToMany(() => TaskSolution, (solution) => solution.user)
    public solutions: TaskSolution[];

    public jwtToken?: string;

    public points?: number;

    public place?: number;

    public hashPassword(): void {
        this.password = bcrypt.hashSync(this.password, 8);
    }

    public checkIfUnencryptedPasswordIsValid(unencryptedPassword: string): boolean {
        if (unencryptedPassword) {
            return bcrypt.compareSync(unencryptedPassword, this.password);
        }
        return false;
    }
}
