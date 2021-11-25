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
                t.solutions = undefined;
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
            t.solutions = undefined;
        }
        res.send(t);
    }

    public static kiosk = async (req: Request, res: Response): Promise<void> => {
        const forceDay = getForceDay(req, res);
        const openTasks: Task[] = [];
        for (const t of tasks) {
            const task = mergeDeep({}, t);
            if (getTaskStatus(task, forceDay) == TaskStatus.OPEN) {
                openTasks.push(t);
            }
        }
        const genTable = () => `
        <div class="w-100">
            <div class="d-flex justify-content-between bg-danger px-3">
                <img class="header mt-2" src="/assets/logos/header.png">
                <h1 class="my-4 headline text-white">AGventskalender</h1>
                <h4 class="mr-2 mt-5 text-white">Stand: ${new Date().toLocaleString()} Uhr</h4>
            </div>
        
            <div class="container-fluid">
                <div class="row p-4 bg-light-transparent">
                    <div class="d-flex justify-content-between mt-5 pt-5 w-100">
                ${openTasks.map((t) => {
            const filename = `${t.day}_raetsel.jpg`;
            const filedata = fs.readFileSync(path.join(__dirname, "../../assets/images/", filename)).toString("base64");
            return `
                    <div class="image-holder">
                        <img class="img-responsive" src="data:image/jpg;base64,${filedata}">
                        <div class="texts px-4">
                            <span class="day d-block">${t.day}</span>
                            <span class="description d-inline-block">${t.description}</span>
                        </div>
                    </div>`;
        }).join("")}
                    </div>
                </div>
            </div>
        </div>`;
        res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>AGventskalender</title>
                <meta http-equiv="refresh" content="60">
                <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" integrity="sha384-JcKb8q3iqJ61gNV9KGb8thSsNjpSL0n8PARn9HuZOnIxN0hoP+VmmDGMN5t9UJ0Z" crossorigin="anonymous">
                <style>
                    html, body, div.container-fluid, div.row, table, tbody {
                        height: 100vh;
                        width: 100vw;
                        overflow: hidden;
                    }
                    body {
                        background-image: url(/assets/backgrounds/banner.jpg);
                        background-size: cover;
                        background-attachment: fixed;
                        background-position: 50%;
                    }
                    .bg-light-transparent {
                        background-color: #ffffff88;
                    }
                    .headline {
                        font-size: 4.5rem;
                    }
                    .image-holder {
                        flex-basis: ${openTasks.length == 4 ? "25%" : openTasks.length == 3 ? "33%" : openTasks.length == 2 ? "50%" : "100%"};
                    }
                    div.texts {
                        text-align: center;
                    }
                    div.texts span.day {
                        font-size: 5rem;
                        color: #000000;
                        text-shadow: -2px 0 white, 0px 2px white, 2px 0 white, 0 -2px white;
                    }
                    div.texts span.description {
                        font-size: 2rem;
                        background-color: white;
                        padding: 0.5rem;
                        line-height: 2rem;
                        font-weight: bold;
                        border-radius: 10px;
                        display: 
                    }
                    .img-responsive {
                        height: 28rem;
                        max-width: 100%;
                        display: block;
                        margin: 0 auto;
                        margin-bottom: 1.5rem;
                        border: 5px solid white;
                        border-radius: 10px;
                    }

                    img.header {
                        height: 6rem;
                    }
                </style>
            </head>
            <body>
                ${openTasks.length == 0 ? `
                <div class="container-fluid">
                    <div class="row p-4">
                    <div class='jumbotron mb-0 w-100 text-center pt-5'>
                    <img class='py-5' src='/assets/logos/header.png'>
                    <h1 class='headline mt-5 pt-5 w-50 m-auto'>
                        Der AGventskalender startet am 01.12.${new Date().getFullYear()}.<br><br>
                        Jetzt auf der Schulhomepage anmelden und mitmachen!
                    </h1>
                </div>
                </div>
                </div>`
            : genTable()}
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
        const suffix = t.status == TaskStatus.SOLVED ? "loesung" : "raetsel";
        const filename = `${day}_${suffix}.jpg`;
        res.sendFile(path.join(__dirname, "../../assets/images/", filename));
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
    return !!t?.solutions?.find((s) => s.row == t.guess.row && s.col == t.guess.col);
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
