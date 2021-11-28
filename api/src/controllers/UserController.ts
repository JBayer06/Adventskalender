import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { TaskStatus } from "../entity/Task";
import { TaskSolution } from "../entity/TaskSolution";
import { User } from "../entity/User";
import { mergeDeep } from "../helpers/merge-deep";
import { getTaskStatus } from "../helpers/task-status";
import { tasks } from "../resources/tasks";
import { getForceDay, taskSolvedCorrectly } from "./TasksController";

const weeksAndPoints: Record<number, number> = { // lastDay with those points
    5: 10,
    12: 20,
    19: 30,
    23: 40,
    24: 60,
};

class UserController {
    public static listUsers = async (req: Request, res: Response): Promise<void> => {
        await UserController.getAllUsers(req, res);
    }
    public static listUsersAdmin = async (req: Request, res: Response): Promise<void> => {
        await UserController.getAllUsers(req, res, true);
    }

    public static newUser = async (req: Request, res: Response): Promise<void> => {
        const {
            nickname, password, password2, realname, grade, email,
        } = req.body;
        if (!(nickname && realname && password && password2 && grade && email)) {
            res.status(400).send({ message: "Nicht alle Felder ausgefüllt!" });
            return;
        }
        if (password != password2) {
            res.status(400).send({ message: "Passwörter stimmen nicht überein!" });
            return;
        }
        if (nickname.length > 20) {
            res.status(400).send({ message: "Dein Nickname ist zu lang!" });
            return;
        }
        const grades: string[] = ["Lehrerin / Lehrer", "Eltern", "Ehemalige Schülerin oder Schüler", "Studienseminar 19/21", "Studienseminar 20/22", "Studienseminar 21/23", "5a", "5b", "5c", "5d", "5e", "5f", "6a", "6b", "6c", "6d", "6e", "6f", "7a", "7b", "7c", "7d", "7e", "7f", "8a", "8b", "8c", "8d", "8e", "8f", "9a", "9b", "9c", "9d", "9e", "9f", "10a", "10b", "10c", "10d", "10e", "10f", "Q11", "Q12"];
        if (!grades.includes(grade)) {
            res.status(400).send({ message: "Die Klasse ist ungültig!" });
            return;
        }

        let user = new User();
        user.nickname = nickname;
        user.realname = realname;
        user.password = password;
        user.email = email;
        user.grade = grade;
        user.isAdmin = false;

        user.hashPassword();

        const userRepository = getRepository(User);
        try {
            user = await userRepository.save(user);
        } catch (e) {
            res.status(409).send({ message: "Der Nickname ist schon vorhanden!", errorField: "nickname" });
            return;
        }
        res.status(200).send({ success: true });
    }

    public static deleteUser = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        const userRepository = getRepository(User);
        const solutionRepository = getRepository(TaskSolution);
        try {
            const user = await userRepository.findOneOrFail(id);
            await solutionRepository.delete({
                user,
            });
            await userRepository.delete(id);
        } catch (e) {
            res.status(500).send({ message: "Konnte den Benutzer nicht löschen!" });
            return;
        }
        res.status(200).send({ success: true });
    }

    public static changeAdminStatus = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { admin } = req.body;

        if (id == res.locals.jwtPayload.userId) {
            res.status(500).send({ message: "Du kannst Dir nicht selbst den Admin-Status entfernen!" });
            return;
        }

        const userRepository = getRepository(User);
        try {
            const user = await userRepository.findOne(id);
            user.isAdmin = admin;
            await userRepository.save(user);
        } catch (e) {
            res.status(500).send({ message: "Konnte den Adminstatus nicht ändern!" });
            return;
        }
        res.status(200).send({ success: true });
    }

    private static async getAllUsers(req: Request, res: Response, forAdmin = false) {
        const userRepository = getRepository(User);
        const users = await userRepository.find({
            relations: ["solutions"],
        });
        const solvedTasks = tasks.filter((t) => getTaskStatus(
            t, getForceDay(req, res),
        ) == TaskStatus.SOLVED)
            .map((t) => t.day);
        res.send(users.map((u) => {
            if (!forAdmin) {
                u.realname = undefined;
                u.email = undefined;
                u.isAdmin = undefined;
            }
            u.points = 0;
            for (const guess of u.solutions.filter((s) => solvedTasks.includes(s.day))) {
                const task = mergeDeep({}, tasks.find((t) => t.day == guess.day));
                task.guess = guess;
                if (taskSolvedCorrectly(u, task)) {
                    for (const [lastDay, points] of Object.entries(weeksAndPoints)) {
                        if (task.day <= parseInt(lastDay)) {
                            u.points += points;
                            break;
                        }
                    }
                }
            }
            u.solutions = undefined;
            return u;
        }));
    }
}

export default UserController;
