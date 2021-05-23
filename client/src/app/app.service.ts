import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppService {
    constructor(private http: HttpClient) { }

    rootURL = '/api';

    sendFiles(form_data:any) {
        return this.http.post(this.rootURL+"/upload", form_data);
    }

    getData() {
        return this.http.get(this.rootURL+"/data");
    }
}