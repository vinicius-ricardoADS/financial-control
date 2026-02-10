import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  // Não adicionar token em requisições de refresh-token e login
  if (req.url.includes('/refresh-token') || req.url.includes('/login')) {
    return next(req);
  }

  const token = authService.getToken();

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/refresh-token')) {
        return handleRefreshToken(authReq, next, authService, userService, router);
      }
      return throwError(() => error);
    })
  );
};

function handleRefreshToken(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  userService: UserService,
  router: Router,
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();

    if (!refreshToken) {
      isRefreshing = false;
      authService.logout();
      router.navigate(['/login']);
      return throwError(() => new HttpErrorResponse({ status: 401 }));
    }

    return from(userService.refreshToken(refreshToken)).pipe(
      switchMap((response) => {
        isRefreshing = false;
        authService.saveTokens(response.token, response.refreshToken);
        refreshTokenSubject.next(response.token);

        // Re-envia a requisição original com o novo token
        const retryReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${response.token}`,
          },
        });
        return next(retryReq);
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshTokenSubject.next(null);
        authService.logout();
        router.navigate(['/login']);
        return throwError(() => refreshError);
      })
    );
  }

  // Se já está fazendo refresh, espera o resultado e re-envia
  return refreshTokenSubject.pipe(
    filter((token) => token !== null),
    take(1),
    switchMap((token) => {
      const retryReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
      return next(retryReq);
    })
  );
}
