import { Component, OnInit } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';

@Component({
  selector: 'app-activation-compte',
  standalone: true,
  imports: [],
  templateUrl: './activation-compte.component.html',
})
export class ActivationCompte implements OnInit {
  idToken?: any;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.idToken = params['id'];
    });

    const decodeToken: any = jwtDecode(this.idToken);
        this.http.put(`${environment.apiUrl}/users/activationCompte`, decodeToken, { withCredentials: true }).subscribe({
        next: () => {
          window.close();
        },
      });
  }


}