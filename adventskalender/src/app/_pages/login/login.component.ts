import { Component } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { AlertService } from "../../_services/alert.service";
import { AuthenticationService } from "../../_services/authentication.service";
import { RemoteService } from "../../_services/remote.service";
import { StorageService } from "../../_services/storage.service";

@Component({
    selector: "app-login",
    templateUrl: "./login.component.html",
    styleUrls: ["./login.component.scss"],
})
export class LoginComponent {
    public year = new Date().getFullYear();
    public loginForm: FormGroup;
    public resetPasswordForm: FormGroup;
    public newPasswordForm: FormGroup;
    public submitted = false;
    public resetPasswordSubmitted = false;
    public newPasswordSubmitted = false;
    public loading = false;
    public tryingToAutoLogin = false;

    public action: "login" | "resetPassword" | "newPassword" = "login";

    passwordResetSuccessfull: boolean;
    resetToken: any;
    passwordChangeSuccessfull: boolean;

    constructor(
        private remoteService: RemoteService,
        private authenticationService: AuthenticationService,
        private router: Router,
        private storageService: StorageService,
        private route: ActivatedRoute,
        private alertService: AlertService,
    ) {
        if (this.route.snapshot.params.token) {
            this.action = "newPassword";
            this.resetToken = this.route.snapshot.params.token;
        }
        this.loginForm = new FormGroup({
            nickname: new FormControl("", [Validators.required]),
            password: new FormControl("", [Validators.required]),
        });
        this.resetPasswordForm = new FormGroup({
            email: new FormControl("", [Validators.required, Validators.email]),
        });
        this.newPasswordForm = new FormGroup({
            password: new FormControl("", [Validators.required, Validators.minLength(5), Validators.pattern(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)]),
            password2: new FormControl("", [Validators.required]),
        });
        const jwtToken = this.storageService.get("jwtToken");
        if (jwtToken) {
            this.tryingToAutoLogin = true;
            this.authenticationService.autoLogin(jwtToken).subscribe((success) => {
                if (success) {
                    if (this.route.snapshot.queryParams.returnUrl) {
                        this.router.navigate([this.route.snapshot.queryParams.returnUrl]);
                    } else {
                        this.router.navigate(["home"]);
                    }
                }
                this.tryingToAutoLogin = false;
            });
        }
    }

    public onSubmit(): void {
        this.submitted = true;
        if (this.loginForm.invalid) {
            return;
        }
        this.loading = true;
        this.authenticationService.login(
            this.loginForm.controls.nickname.value,
            this.loginForm.controls.password.value,
        ).subscribe(() => {
            this.loading = true;
            this.submitted = false;
            this.loggedInSuccessfully();
        }, () => {
            this.loading = false;
        });
    }

    public onResetPasswordSubmit(): void {
        this.resetPasswordSubmitted = true;
        if (this.resetPasswordForm.invalid) {
            return;
        }
        this.loading = true;
        this.remoteService.post("auth/resetPassword", { email: this.resetPasswordForm.controls.email.value }).subscribe((data) => {
            this.loading = false;
            if (data && data.success) {
                this.passwordResetSuccessfull = true;
                this.action = "login";
            }
        }, () => {
            this.loading = false;
        });
    }

    public onNewPasswordSubmit(): void {
        this.newPasswordSubmitted = true;
        if (this.newPasswordForm.invalid) {
            return;
        }
        this.loading = true;
        this.remoteService.post(`auth/newPassword/${this.resetToken}`, {
            password1: this.newPasswordForm.controls.password.value,
            password2: this.newPasswordForm.controls.password2.value,
        }).subscribe((data) => {
            this.loading = false;
            if (data && data.success) {
                this.passwordChangeSuccessfull = true;
                this.action = "login";
            }
        }, () => {
            this.loading = false;
        });
    }

    private loggedInSuccessfully() {
        this.loading = false;
        if (this.route.snapshot.queryParams.returnUrl) {
            this.router.navigate([this.route.snapshot.queryParams.returnUrl]);
        } else {
            this.router.navigate(["welcome"]);
        }
    }
}
