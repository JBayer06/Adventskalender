export type Field = {
    row: number;
    col: string;
}

export type Task = {
    day: number;
    status?: TaskStatus;
    solutionStatus?: SolutionStatus;
    guess?: Field;
    description: string;
    solutions: Field[];
};

export enum TaskStatus {
    LOCKED = "LOCKED",
    OPEN = "OPEN",
    SOLVED = "SOLVED",
}

export enum SolutionStatus {
    CORRECT = "CORRECT",
    INCORRECT = "INCORRECT",
}
