import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { StorageService } from "./storage.service";
import { AuthenticationService } from "./authentication.service";

@Injectable({
    providedIn: "root",
})
export class RemoteService {
    constructor(private httpClient: HttpClient, private storageService: StorageService) {
    }

    public getImageUrl(url: string, authService: AuthenticationService): string {
        return `/api/${url}?authorization=${authService.currentUser?.jwtToken}`;
    }

    public get(url: string): Observable<any> {
        return this.httpClient.get(`/api/${url}`);
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public post(url: string, data: { [key: string]: any }, options?: any): Observable<any> {
        return this.httpClient.post(`/api/${url}`, data, options);
    }

    public delete(url: string): Observable<any> {
        return this.httpClient.delete(`/api/${url}`);
    }
}
