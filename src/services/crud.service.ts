import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export class CrudService<T> {
  constructor(protected http: HttpClient, protected baseUrl: string) {}
  getAll(): Observable<T[]>         { return this.http.get<T[]>(this.baseUrl); }
  get(id: number): Observable<T>     { return this.http.get<T>(`${this.baseUrl}/${id}`); }
  add(item: T): Observable<T>        { return this.http.post<T>(this.baseUrl, item); }
  update(item: T): Observable<T>     { return this.http.put<T>(`${this.baseUrl}/${(item as any).id}`, item); }
  delete(id: number): Observable<{}> { return this.http.delete(`${this.baseUrl}/${id}`); }
}