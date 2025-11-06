import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category, DEFAULT_CATEGORIES } from '../models/category.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'categories';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$: Observable<Category[]> =
    this.categoriesSubject.asObservable();

  constructor(private storage: StorageService) {
    this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    let categories = await this.storage.get<Category[]>(STORAGE_KEY);

    // Se não existir categorias, usa as padrões
    if (!categories || categories.length === 0) {
      categories = DEFAULT_CATEGORIES;
      await this.storage.set(STORAGE_KEY, categories);
    }

    this.categoriesSubject.next(categories);
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoriesSubject.value;
  }

  async getCategoriesByType(
    type: 'income' | 'expense',
  ): Promise<Category[]> {
    const categories = this.categoriesSubject.value;
    return categories.filter((c) => c.type === type);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const categories = this.categoriesSubject.value;
    return categories.find((c) => c.id === id);
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const categories = [...this.categoriesSubject.value];
    const newCategory: Category = {
      ...category,
      id: this.generateId(),
    };

    categories.push(newCategory);
    await this.storage.set(STORAGE_KEY, categories);
    this.categoriesSubject.next(categories);

    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    const categories = this.categoriesSubject.value.map((cat) =>
      cat.id === id ? { ...cat, ...updates } : cat,
    );

    await this.storage.set(STORAGE_KEY, categories);
    this.categoriesSubject.next(categories);
  }

  async deleteCategory(id: string): Promise<void> {
    const categories = this.categoriesSubject.value.filter(
      (cat) => cat.id !== id,
    );

    await this.storage.set(STORAGE_KEY, categories);
    this.categoriesSubject.next(categories);
  }

  async resetToDefaults(): Promise<void> {
    await this.storage.set(STORAGE_KEY, DEFAULT_CATEGORIES);
    this.categoriesSubject.next(DEFAULT_CATEGORIES);
  }

  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
