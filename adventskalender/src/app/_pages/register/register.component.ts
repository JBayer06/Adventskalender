import { Component } from "@angular/core";
import {
    FormControl, FormGroup, Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { RemoteService } from "../../_services/remote.service";
import { AlertService } from "../../_services/alert.service";

@Component({
    selector: "app-register",
    templateUrl: "./register.component.html",
    styleUrls: ["./register.component.scss"],
})
export class RegisterComponent {
    public year = new Date().getFullYear();
    public form: FormGroup;
    public submitted = false;
    public loading = false;

    constructor(
        private alertService: AlertService,
        private remoteService: RemoteService,
        private router: Router,
    ) {
        this.form = new FormGroup({
            realname: new FormControl("", [Validators.required, Validators.pattern(/(.+ .+)/)]),
            grade: new FormControl("", [Validators.required]),
            email: new FormControl("", [Validators.required, Validators.email]),
            nickname: new FormControl("", [Validators.required, Validators.maxLength(20)]),
            password: new FormControl("", [Validators.required, Validators.minLength(5), Validators.pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)]),
            password2: new FormControl("", [Validators.required]),
        }, this.confirmPasswordValidator("password", "password2"));
    }

    public confirmPasswordValidator(controlName: string, matchingControlName: string): any {
        return (formGroup: FormGroup) => {
            const control = formGroup.controls[controlName];
            const matchingControl = formGroup.controls[matchingControlName];
            if (matchingControl.errors && !matchingControl.errors.confirmedValidator) {
                return;
            }
            if (control.value !== matchingControl.value) {
                matchingControl.setErrors({ confirmedValidator: true });
            } else {
                matchingControl.setErrors(null);
            }
        };
    }

    public onSubmit(): void {
        this.alertService.removeAll();
        this.submitted = true;
        if (this.form.invalid) {
            return;
        }
        this.loading = true;
        this.remoteService.post("users", {
            nickname: this.form.controls.nickname.value,
            realname: this.form.controls.realname.value,
            grade: this.form.controls.grade.value,
            email: this.form.controls.email.value,
            password: this.form.controls.password.value,
            password2: this.form.controls.password2.value,
        }).subscribe((data: any) => {
            this.loading = false;
            if (data && data.success) {
                this.submitted = false;
                this.alertService.success("Dein Benutzer wurde erfolgreich erstellt!");
                this.router.navigate(["/login"]);
            }
        }, () => {
            this.loading = false;
        });
    }
}
