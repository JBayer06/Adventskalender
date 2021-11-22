import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { RemoteService } from "../../_services/remote.service";
import { Task, Field, TaskStatus } from "../../_models/Task";
import { AuthenticationService } from "../../_services/authentication.service";
import { AlertService } from "../../_services/alert.service";
import { getTaskStatus } from "../../_helpers/task-status";

@Component({
    selector: "app-task",
    templateUrl: "./task.component.html",
    styleUrls: ["./task.component.scss"],
})
export class TaskComponent {
    public task: Task;
    public loading = true;
    public saving = false;
    public due: Date = new Date();
    public selectedField: { col: string, row: number } = {} as any;
    public cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
    public rows = [9, 8, 7, 6, 5, 4, 3, 2, 1];
    constructor(
        public remoteService: RemoteService,
        public authenticationService: AuthenticationService,
        private route: ActivatedRoute,
        private alertService: AlertService,
        private router: Router,
    ) {
        this.route.params.subscribe((params) => {
            if (params.day && parseInt(params.day, 10)) {
                const day = parseInt(params.day, 10);
                this.remoteService.get(`tasks/${day}`).subscribe((t: Task) => {
                    this.task = t;
                    if (this.task.guess) {
                        this.selectedField = {
                            row: this.task.guess.row,
                            col: this.task.guess.col,
                        };
                    }
                    const d = new Date();
                    d.setMonth(11);
                    d.setDate(this.task.day);

                    let add = 0;
                    while (getTaskStatus(this.task, this.task.day + add) == TaskStatus.OPEN) {
                        this.due = new Date(2021, 11, this.task.day + add);
                        add++;
                    }
                    this.loading = false;
                });
            }
        });
    }

    public selectField(col: string, row: number): void {
        if (this.task.status !== TaskStatus.OPEN) {
            return;
        }
        this.selectedField = {
            col,
            row,
        };
    }

    public getCorrectSolutionsString(): string {
        const { solutions } = this.task[this.authenticationService.isYoung ? "young" : "old"];
        return solutions.length == 1
            ? this.printField(solutions[0])
            : solutions.length == 2
                ? `${this.printField(solutions[0])} oder ${this.printField(solutions[1])}`
                : `${solutions.slice(0, solutions.length - 2).map((f) => this.printField(f)).join(", ")}, ${this.printField(solutions[solutions.length - 2])} oder ${this.printField(solutions[solutions.length - 1])}`;
    }

    private printField(field: Field) {
        return `${field.col}${field.row}`;
    }

    public save(): void {
        this.saving = true;
        this.remoteService.post(`tasks/${this.task.day}`, { ...this.selectedField }).subscribe((d) => {
            if (d?.success) {
                this.alertService.success("Deine Lösung wurde erfolgreich gespeichert!");
                this.router.navigate(["/tasks"]);
            }
            this.saving = false;
        });
    }
}
