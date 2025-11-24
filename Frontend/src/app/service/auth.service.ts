import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.dev';
import { map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

constructor(private http: HttpClient) {}

 isLoggedIn() {
    return this.http
      .get<{ authenticated: boolean }>(
        `${environment.apiUrl}/auth/UserConnecte`,
        { withCredentials: true }
      )
      .pipe(
        map(res => res.authenticated),
        catchError(() => of(false))
      );
}


}