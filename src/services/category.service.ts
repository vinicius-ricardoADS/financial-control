import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Category } from '../models/category.model';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly apiUrl = `${environment.api}/categories`;
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$: Observable<Category[]> =
    this.categoriesSubject.asObservable();

  private categoriesLoaded = false;

  constructor(private http: HttpClient) {}

  async getAllCategories(): Promise<Category[]> {
    // Retorna do cache se já foi carregado
    if (this.categoriesLoaded && this.categoriesSubject.value.length > 0) {
      return this.categoriesSubject.value;
    }

    const categories = await firstValueFrom(
      this.http.get<Category[]>(this.apiUrl).pipe(
        tap((data) => {
          this.categoriesSubject.next(data);
          this.categoriesLoaded = true;
        })
      )
    );
    return categories;
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    // Tenta buscar do cache primeiro
    if (this.categoriesLoaded) {
      const cached = this.categoriesSubject.value.find((c) => c.id === id);
      if (cached) return cached;
    }

    try {
      const category = await firstValueFrom(
        this.http.get<Category>(`${this.apiUrl}/${id}`)
      );
      return category;
    } catch {
      return undefined;
    }
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const newCategory = await firstValueFrom(
      this.http.post<Category>(this.apiUrl, category)
    );
    const categories = [...this.categoriesSubject.value, newCategory];
    this.categoriesSubject.next(categories);
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    await firstValueFrom(
      this.http.put<Category>(`${this.apiUrl}/${id}`, updates)
    );
    const categories = this.categoriesSubject.value.map((cat) =>
      cat.id === id ? { ...cat, ...updates } : cat
    );
    this.categoriesSubject.next(categories);
  }

  async deleteCategory(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`)
    );
    const categories = this.categoriesSubject.value.filter(
      (cat) => cat.id !== id
    );
    this.categoriesSubject.next(categories);
  }

  /**
   * Força recarregar as categorias do servidor
   */
  async refreshCategories(): Promise<Category[]> {
    this.categoriesLoaded = false;
    return this.getAllCategories();
  }
}
