// src/app/service/theme.service.ts
import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentId = 'indigo' | 'emerald' | 'rose' | 'sky';

export interface ThemeSettings {
  theme: ThemeMode;
  accent: AccentId;
}

const STORAGE_KEY = 'loom-theme-settings';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private settings: ThemeSettings = {
    theme: 'light',
    accent: 'indigo',
  };

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.loadFromStorage();
    this.applySettings();
  }

  get current(): ThemeSettings {
    return this.settings;
  }

  setTheme(theme: ThemeMode) {
    this.settings = { ...this.settings, theme };
    this.applySettings();
    this.saveToStorage();
  }

  setAccent(accent: AccentId) {
    this.settings = { ...this.settings, accent };
    this.applySettings();
    this.saveToStorage();
  }

  // ----------------- PRIVÉ -----------------

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ThemeSettings>;
      this.settings = { ...this.settings, ...parsed };
    } catch (e) {
      console.warn('Erreur chargement thème', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Erreur sauvegarde thème', e);
    }
  }

  private applySettings() {
    const docEl = this.document.documentElement; // <html>
    const body = this.document.body;

    // Accent : <html data-accent="indigo|emerald|...">
    docEl.setAttribute('data-accent', this.settings.accent);

    // Thème effectif (light / dark / system)
    const prefersDark =
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const effectiveTheme =
      this.settings.theme === 'system'
        ? prefersDark
          ? 'dark'
          : 'light'
        : this.settings.theme;

    if (effectiveTheme === 'dark') {
      body.classList.add('theme-dark');
    } else {
      body.classList.remove('theme-dark');
    }
  }

  // theme.service.ts
applyAuthTheme() {
  // Thème spécial pour les pages d’auth : toujours clair
  const body = this.document.body;
  const html = this.document.documentElement;

  // pas de dark mode sur le login
  body.classList.remove('theme-dark');

  // accent par défaut (peu importe la préférence utilisateur)
  html.setAttribute('data-accent', 'indigo');
}

// Quand l’utilisateur est connecté -> réappliquer ses préférences
reapplyUserTheme() {
  this.applySettings(); // méthode privée qui utilise this.settings
}

}
