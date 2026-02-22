import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.dev';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, switchMap, takeUntil } from 'rxjs/operators';

type SearchFilter = 'all' | 'people' | 'groups';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-page.component.html',
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  searchControl = new FormControl<string>('', { nonNullable: true });
  activeFilter: SearchFilter = 'all';

  loading = false;

  people: any[] = [];
  totalPeople = 0;
  pagePeople = 1;
  limitPeople = 20;

  groups: any[] = [];

  defaultAvatar = 'https://user-gen-media-assets.s3.amazonaws.com/seedream_images/767173db-56b6-454b-87d2-3ad554d47ff7.png';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // 1) Sync UI depuis l’URL
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const q = (params.get('q') || '').trim();
        const f = (params.get('filter') as SearchFilter) || 'all';

        this.activeFilter = ['all', 'people', 'groups'].includes(f) ? f : 'all';

        if (q !== this.searchControl.value) {
          this.searchControl.setValue(q, { emitEvent: false });
        }
      });

    // 2) Quand l’utilisateur tape -> mettre à jour l’URL
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((q) => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: q.trim(), filter: this.activeFilter },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });

    // 3) Rechercher quand (q/filter) change dans l’URL
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          q: (params.get('q') || '').trim(),
          filter: ((params.get('filter') as SearchFilter) || 'all'),
        })),
        distinctUntilChanged((a, b) => a.q === b.q && a.filter === b.filter),
        switchMap(({ q, filter }) => {
          if (!q || q.length < 2) {
            this.resetResults();
            return of(null);
          }

          this.loading = true;
          this.activeFilter = ['all', 'people', 'groups'].includes(filter) ? filter : 'all';
          this.pagePeople = 1; // reset pagination

          return this.doSearch(q, this.activeFilter).pipe(
            finalize(() => (this.loading = false)),
            catchError((err) => {
              console.error('Erreur recherche page:', err);
              this.resetResults();
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res: any) => {
        if (!res) return;
        this.people = res.people || [];
        this.totalPeople = res.totalPeople || 0;
        this.groups = res.groups || [];
      });
  }

  resetResults() {
    this.people = [];
    this.groups = [];
    this.totalPeople = 0;
    this.pagePeople = 1;
  }

  setFilter(filter: SearchFilter) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { filter },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  openProfile(user: any) {
    this.router.navigate(['/profil', user.id]);
  }

  // -----------------------
  // API calls
  // -----------------------

  private searchUsersFull(term: string, page = 1) {
    // ✅ CORRECTION ICI : Ajout de '/users' car votre route est dans user.routes.js
    return this.http.get<any>(
      `${environment.apiUrl}/users/search/all?term=${encodeURIComponent(term)}&page=${page}&limit=${this.limitPeople}`,
      { withCredentials: true }
    );
  }

  loadMorePeople() {
    if (this.activeFilter === 'groups') return;
    if (this.people.length >= this.totalPeople) return;

    const term = (this.searchControl.value || '').trim();
    if (term.length < 2) return;

    this.pagePeople += 1;
    this.loading = true;

    this.searchUsersFull(term, this.pagePeople)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          const users = res.users || [];
          this.totalPeople = res.total || this.totalPeople;
          this.people = [...this.people, ...users];
        },
        error: (err) => {
          console.error('Erreur load more:', err);
          this.pagePeople -= 1;
        },
      });
  }

  private searchGroups(term: string) {
    // ⚠️ ATTENTION : Si vous avez mis la route groupe dans user.routes.js avec '/groups-search'
    // Alors utilisez : `${environment.apiUrl}/users/groups-search?term=...`
    
    // Si vous avez un fichier group.routes.js monté sur /api/groups, gardez ceci :
    return this.http
      .get<any>(`${environment.apiUrl}/groups/search?term=${encodeURIComponent(term)}`, {
        withCredentials: true,
      })
      .pipe(map((res) => res.groups || []));
  }

  private doSearch(term: string, filter: SearchFilter) {
    const wantPeople = filter === 'all' || filter === 'people';
    const wantGroups = filter === 'all' || filter === 'groups';

    const people$ = wantPeople
      ? this.searchUsersFull(term, 1).pipe(
          map((res) => ({
            users: res.users || [], // backend renvoie { users: [...] }
            total: res.total || 0,
          })),
          catchError(() => of({ users: [], total: 0 }))
        )
      : of({ users: [], total: 0 });

    const groups$ = wantGroups
      ? this.searchGroups(term).pipe(catchError(() => of([])))
      : of([]);

    return forkJoin({ peopleRes: people$, groups: groups$ }).pipe(
      map(({ peopleRes, groups }) => ({
        people: peopleRes.users,
        totalPeople: peopleRes.total,
        groups,
      }))
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}