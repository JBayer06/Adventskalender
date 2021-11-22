/* eslint-disable no-use-before-define */
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import * as path from "path";
import * as fs from "fs";
import { SolutionStatus, Task, TaskStatus } from "../entity/Task";
import { TaskSolution } from "../entity/TaskSolution";
import { User } from "../entity/User";
import { tasks } from "../resources/tasks";
import { getTaskStatus } from "../helpers/task-status";
import { checkUserYoung } from "./AuthController";
import { mergeDeep } from "../helpers/merge-deep";

class TasksController {
    public static listAll = async (req: Request, res: Response): Promise<void> => {
        const me = await getRepository(User).findOne(res.locals.jwtPayload.userId);
        const guesses = (await getRepository(TaskSolution).find({
            where: {
                user: me,
            },
        })) || [];

        const forceDay = getForceDay(req, res);

        const ts = [];
        for (const task of tasks) {
            const t = mergeDeep({}, task);
            t.status = getTaskStatus(t, forceDay);
            const guess = guesses.find((g) => g.day == t.day);
            if (guess) {
                t.guess = {
                    row: guess.row,
                    col: guess.col,
                };
            }
            if (t.status == TaskStatus.SOLVED) {
                t.solutionStatus = taskSolvedCorrectly(res.locals.jwtPayload.user, t)
                    ? SolutionStatus.CORRECT
                    : SolutionStatus.INCORRECT;
            } else {
                t.young.solutions = undefined;
                t.old.solutions = undefined;
            }
            ts.push(t);
        }

        res.send(ts);
    }
    public static getTask = async (req: Request, res: Response): Promise<void> => {
        const day = parseInt(req.params.day, 10);
        const t = mergeDeep({}, tasks.find((ts) => ts.day == day));
        const forceDay = getForceDay(req, res);
        t.status = getTaskStatus(t, forceDay);
        if (t.status == TaskStatus.LOCKED) {
            res.status(401).send({ message: "Diese Aufgabe ist noch nicht freigeschalten!" });
            return;
        }
        try {
            const me = await getRepository(User).findOne(res.locals.jwtPayload.userId);
            const guess = await getRepository(TaskSolution).findOne({
                where: {
                    user: me,
                    day,
                },
            });
            if (guess) {
                t.guess = {
                    row: guess.row,
                    col: guess.col,
                };
            }
        } catch {
            //
        }
        if (t.status == TaskStatus.SOLVED) {
            t.solutionStatus = taskSolvedCorrectly(res.locals.jwtPayload.user, t)
                ? SolutionStatus.CORRECT
                : SolutionStatus.INCORRECT;
        } else {
            t.young.solutions = undefined;
            t.old.solutions = undefined;
        }
        res.send(t);
    }

    public static kiosk = async (req: Request, res: Response): Promise<void> => {
        let forceDay: number;
        if (req.app.locals.config.TEST_MODE && req.query.forceDay) {
            forceDay = parseInt(req.query.forceDay, 10);
        }
        const openTasks: Task[] = [];
        for (const t of tasks) {
            const task = mergeDeep({}, t);
            if (getTaskStatus(task, forceDay) == TaskStatus.OPEN) {
                openTasks.push(t);
            }
        }
        const getTdTag = (t: Task, old: boolean) => {
            const filename = `${t.day}_${old ? "alt" : "jung"}_raetsel.jpg`;
            const { description } = t[old ? "old" : "young"];
            const filedata = fs.readFileSync(path.join(__dirname, "../../assets/images/", filename)).toString("base64");
            return `<td class="img-holder"><div class="overlay"><span class="day">${t.day}</span><br><span class="description">${description}</span></div><img class="img-responsive" src="data:image/jpg;base64,${filedata}"></td>`;
        };
        const genTable = () => `<table>
            <tbody>
                <tr class="text text-center">
                    <td colspan="${openTasks.length}">
                        <div class="d-flex justify-content-between">
                            <img class="header" src="/assets/logos/header.png">
                            <h1 class="mt-4">Klasse 5 und 6</h1>
                            <h4 class="mr-2 mt-2">Stand: ${new Date().toLocaleString()} Uhr</h4>
                        </div>
                    </td>
                </tr>
                <tr class="images">
                    ${openTasks.map((t) => getTdTag(t, false)).join("")}
                </tr>
                <tr class="text text-center">
                    <td colspan="${openTasks.length}"><h1>Klasse 7 bis 12</h1></td>
                </tr>
                <tr class="images">
                    ${openTasks.map((t) => getTdTag(t, true)).join("")}
                </tr>
            </tbody>
        </table>`;
        res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>AGventskalender</title>
                <meta http-equiv="refresh" content="60">
                <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
                <style>
                    body {
                        
                    }
                    html, body, div.container-fluid, div.row, table, tbody {
                        height: 100vh;
                        width: 100vw;
                        overflow: hidden;
                    }
                    tr.text {
                        height: 10%;
                    }
                    tr.images {
                        height: 40%;
                    }
                    td.img-holder {
                        height: 40%;
                        position: relative;
                    }
                    div.overlay {
                        position: absolute;
                        bottom: 0;
                        width: 100%;
                        text-align: center;
                    }
                    div.overlay span.day {
                        font-size: 3rem;
                        color: #fff;
                        text-shadow: -2px 0 black, 0 1px black, 2px 0 black, 0 -2px black;
                    }
                    div.overlay span.description {
                        font-size: 1rem;
                        background-color: white;
                        padding: 0.5rem;
                        line-height: 2rem;
                        font-weight: bold;
                    }
                    .img-responsive {
                        height: 13rem;
                        max-width: 100%;
                        max-height: 100%;
                        display: block;
                        margin: 0 auto;
                        padding-bottom: 2.5rem;
                    }

                    img.header {
                        height: 6rem;
                    }
                </style>
            </head>
            <body>
                <div class="container-fluid">
                    <div class="row">
                        ${openTasks.length == 0 ? `<div class='jumbotron mb-0 w-100 text-center pt-5'><h1 class='mt-5 pt-5'><img class='py-5' src='/assets/logos/header.png'><br>Der AGventskalender startet am 01.12.${new Date().getFullYear()}!</h1></div>` : genTable()}
                    </div>
                </div>
            </body>
        </html>
        `);
    }

    public static getImage = async (req: Request, res: Response): Promise<void> => {
        const day = parseInt(req.params.day, 10);
        const t = mergeDeep({}, tasks.find((ts) => ts.day == day));
        const forceDay = getForceDay(req, res);
        t.status = getTaskStatus(t, forceDay);
        if (t.status == TaskStatus.LOCKED) {
            res.status(401).send("Diese Aufgabe ist noch nicht freigeschalten!");
            return;
        }
        res.sendFile(path.join(__dirname, "../../assets/images/", `${day}_${checkUserYoung(res.locals.jwtPayload.user) ? "jung" : "alt"}_${t.status == TaskStatus.SOLVED ? "loesung" : "raetsel"}.jpg`));
    }

    public static saveSolution = async (req: Request, res: Response): Promise<void> => {
        const day = parseInt(req.params.day, 10);
        const t = mergeDeep({}, tasks.find((ts) => ts.day == day));
        const forceDay = getForceDay(req, res);
        t.status = getTaskStatus(t, forceDay);
        if (t.status == TaskStatus.LOCKED) {
            res.status(401).send({ message: "Diese Aufgabe ist noch nicht freigeschaltet!" });
            return;
        }
        if (t.status == TaskStatus.SOLVED) {
            res.status(401).send({ message: "Diese Aufgabe ist leider schon abgelaufen!" });
            return;
        }
        if (!(req.body.row && req.body.col)) {
            res.status(400).send({ message: "Nicht alle Felder wurden ausgefüllt!" });
            return;
        }

        const solutionRepository = getRepository(TaskSolution);
        const me = await getRepository(User).findOne(res.locals.jwtPayload.userId);
        let solution = await solutionRepository.findOne({
            where: {
                user: me,
                day,
            },
        });
        if (!solution) {
            solution = new TaskSolution();
            solution.user = me;
            solution.day = day;
        }
        solution.col = req.body.col;
        solution.row = req.body.row;
        try {
            await solutionRepository.save(solution);
        } catch {
            res.status(500).send({ message: "Error" });
            return;
        }
        res.send({ success: true });
    }
}

export default TasksController;

export function taskSolvedCorrectly(user: User, t: Task): boolean {
    if (!(t.guess?.row && t.guess?.col)) {
        return false;
    }
    return !!t[checkUserYoung(user) ? "young" : "old"]?.solutions?.find((s) => s.row == t.guess.row && s.col == t.guess.col);
}

export function getForceDay(req: Request, res: Response): number {
    if (res.app.locals.config.TEST_MODE) {
        try {
            const d = parseInt(req.headers.cookie.split(";").map((t) => t.trim())?.find((t) => t.startsWith("forceDay=")).replace("forceDay=", "")?.trim());
            return d;
        } catch {
            //
        }
    }
    return undefined;
}

/*
    document.cookie = "forceDay= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "forceDay="+parseInt(prompt("Aktueller Tag"));
*/
