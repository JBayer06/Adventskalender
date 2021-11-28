import { Component } from "@angular/core";
import { User } from "../../_models/User";
import { AuthenticationService } from "../../_services/authentication.service";
import { RemoteService } from "../../_services/remote.service";

type View = {
    id: string;
    name: string;
}

@Component({
    selector: "app-scores",
    templateUrl: "./scores.component.html",
    styleUrls: ["./scores.component.scss"],
})
export class ScoresComponent {
    public users: User[] = [];
    public allUsers: User[] = [];
    public maxPoints = 1000000000;
    public myPlace: number;
    public placesCount: number;
    public loading = true;
    public views: View[] = [
        {
            id: "all",
            name: "Alle",
        },
        {
            id: "students",
            name: "Schüler",
        },
        {
            id: "formerStudents",
            name: "Ehemalige Schüler",
        },
        {
            id: "teachers",
            name: "Lehrer",
        },
        {
            id: "parents",
            name: "Eltern",
        },
        {
            id: "grades-absolute",
            name: "Klassen (absolut)",
        },
        {
            id: "grades-relative",
            name: "Klassen (relativ)",
        },
    ];
    public currentView = this.views[0];
    constructor(
        private remoteService: RemoteService,
        public authenticationService: AuthenticationService,
    ) { }

    public ngOnInit(): void {
        this.remoteService.get("users").subscribe((data) => {
            if (data) {
                this.loading = false;
                this.allUsers = data;
                this.filterAndDisplayData();
            }
        });
    }

    private filterAndDisplayData() {
        if (this.currentView.id == "all") {
            this.users = this.allUsers;
        } else if (this.currentView.id == "students") {
            this.users = this.allUsers.filter((u) => u.grade.length < 4);
        } else if (this.currentView.id == "formerStudents") {
            this.users = this.allUsers.filter((u) => u.grade == "Ehemalige Schülerin oder Schüler");
        } else if (this.currentView.id == "parents") {
            this.users = this.allUsers.filter((u) => u.grade == "Eltern");
        } else if (this.currentView.id == "teachers") {
            this.users = this.allUsers.filter((u) => u.grade === "Lehrerin / Lehrer" || u.grade.startsWith("Studienseminar"));
        } else if (this.currentView.id == "grades-relative" || this.currentView.id == "grades-absolute") {
            const grades = {};
            for (const user of this.allUsers) {
                if (!grades[user.grade]) {
                    grades[user.grade] = {
                        points: 0,
                        users: 0,
                    };
                }
                grades[user.grade].points += user.points;
                grades[user.grade].users++;
            }
            this.users = [];
            for (const [grade, d] of Object.entries(grades) as any) {
                this.users.push({
                    grade,
                    points: this.currentView.id == "grades-absolute" ? d.points : Math.round(d.points / d.users),
                } as any);
            }
        }
        this.users.sort((a, b) => b.points - a.points);
        this.maxPoints = 1000000000;
        let place = 1;
        let lastUser;
        for (const user of this.users) {
            if (lastUser?.points && user.points < lastUser.points) {
                place++;
            }
            user.place = place;
            lastUser = user;
        }
        if (this.authenticationService.currentUser) {
            if (this.currentView.id == "grades-absolute" || this.currentView.id == "grades-relative") {
                this.myPlace = this.users.filter(
                    (u) => u.grade == this.authenticationService.currentUser.grade,
                )[0]?.place;
            } else {
                const user = this.users.filter(
                    (u) => u.nickname == this.authenticationService.currentUser.nickname,
                );
                if (user && user[0]) {
                    this.myPlace = user[0].place;
                } else {
                    this.myPlace = undefined;
                }
            }
            this.placesCount = this.users[this.users.length - 1]?.place;
        }
        setTimeout(() => {
            if (this.users.length) {
                this.maxPoints = this.users.reduce((p, c) => (p.points > c.points ? p : c)).points;
            }
        }, 20);
    }

    public view(v: View): void {
        this.currentView = v;
        this.filterAndDisplayData();
    }
}
