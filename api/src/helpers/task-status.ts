import { Task, TaskStatus } from "../entity/Task";

const CHRISTMAS = 24;

export function getBack(taskDay: number, dayOfWeek: number): number {
    if (taskDay == CHRISTMAS) {
        return 4;
    }

    enum DayOfWeek {
        SUNDAY = 0,
        MONDAY = 1,
        TUESDAY = 2,
        WEDNESDAY = 3,
        THURSDAY = 4,
        FRIDAY = 5,
        SATURDAY = 6
    }

    switch (dayOfWeek) {
    case DayOfWeek.SUNDAY:
        return 3;
    case DayOfWeek.MONDAY:
        return 4;
    case DayOfWeek.TUESDAY:
        return 4;
    case DayOfWeek.WEDNESDAY:
        return 2;
    case DayOfWeek.THURSDAY:
        return 2;
    case DayOfWeek.FRIDAY:
        return 2;
    case DayOfWeek.SATURDAY:
        return 2;
    default:
        break;
    }
    return 0;
}

export function getTaskStatus(task: Task, fakeTodayForTesting?: number): TaskStatus {
    const year = new Date().getFullYear();
    let now: Date;
    // let todayDay: number;
    let date: Date;
    // let month: number;
    // January is month 0, that's why December is 11
    if (fakeTodayForTesting) {
        now = new Date(year, 11, fakeTodayForTesting);
        // todayDay = fakeTodayForTesting;
        date = new Date(year, 11, task.day);
        // month = 12;
    } else {
        now = new Date();
        now.setHours(0, 0, 0, 0);
        // todayDay = now.getDate();
        date = new Date(year, 11, task.day);
        // month = new Date().getMonth();
    }
    const dayOfWeek = now.getDay();
    const dateDiff = date.getTime() - now.getTime();
    const diff = Math.floor(dateDiff / (60 * 60 * 24 * 1000));

    const zurueckliegend = getBack(task.day, dayOfWeek);
    if (-zurueckliegend < diff && diff <= 0) {
        return TaskStatus.OPEN;
    }
    if (diff > 0) {
        return TaskStatus.LOCKED;
    }
    // if (differance <= -zurueckliegend) {
    return TaskStatus.SOLVED;
    // }
}
