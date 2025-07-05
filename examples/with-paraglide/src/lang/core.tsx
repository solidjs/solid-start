// ============================================
// TYPES AND INTERFACES
// ============================================

import {
  Accessor,
  Component,
  createContext,
  createEffect,
  createMemo,
  ParentProps,
  useContext,
} from 'solid-js';
import { m } from '~/paraglide/messages.js';
import { baseLocale, locales } from '~/paraglide/runtime';
import { A, AnchorProps, useLocation, useNavigate, useParams } from '@solidjs/router';
// @ts-ignore
import { PageEvent } from "@solidjs/start/dist/server";

// Exported Types
export type AvailableLanguage = (typeof locales)[number];
export type ParaglideMessages = typeof m;
export type MessageKey = keyof ParaglideMessages;

// Interfaces
export interface ParsedPath {
  path: string;
  queryAndHash: string;
  params: string[];
  hasLanguage: boolean;
  language: AvailableLanguage;
}

export interface PathOptions {
  skipExternal?: boolean;
  skipStatic?: boolean;
  preserveRootSlash?: boolean;
}

export interface LangContextValue {
  locale: Accessor<AvailableLanguage>;
  messages: Accessor<ParaglideMessages>;
  availableLocales: readonly AvailableLanguage[];
  setLocale: (locale: AvailableLanguage) => void;
}

// ============================================
// CONSTANTS
// ============================================

const AVAILABLE_LANGUAGES = new Set(locales as unknown as string[]);
const STATIC_ASSET_REGEX = /\.(?:css|js|map|json|ico|svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$/i;
const EXTERNAL_URL_REGEX = /^https?:\/\//;

// ============================================
// CONTEXT
// ============================================

const LangContext = createContext<LangContextValue>();

// ============================================
// VALIDATION UTILITIES
// ============================================

function isAvailableLanguage(locale: string): locale is AvailableLanguage {
  return AVAILABLE_LANGUAGES.has(locale);
}

function shouldSkipPath(pathname: string, options: PathOptions): boolean {
  const { skipExternal = false, skipStatic = false } = options;

  if (skipExternal && EXTERNAL_URL_REGEX.test(pathname)) {
    return true;
  }

  return skipStatic && STATIC_ASSET_REGEX.test(pathname);
}

// ============================================
// PATH MANIPULATION UTILITIES
// ============================================

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function parsePathname(pathname: string): ParsedPath {
  const normalizedPath = normalizePath(pathname);

  // Separate path from query/hash
  const [path, ...rest] = normalizedPath.split(/([?#])/);
  const queryAndHash = rest.join('');
  const params = path.split('/').filter(Boolean);

  const firstParam = params[0];
  const hasLanguage = Boolean(firstParam && isAvailableLanguage(firstParam));

  return {
    path,
    queryAndHash,
    params,
    hasLanguage,
    language: (hasLanguage && firstParam ? firstParam : baseLocale) as AvailableLanguage,
  };
}

function buildPath(parts: string[], preserveTrailingSlash: boolean, originalPath: string): string {
  if (!parts.length) return '/';

  let newPath = `/${parts.join('/')}`;

  // Preserve trailing slash if necessary
  if (preserveTrailingSlash && originalPath.endsWith('/') && !newPath.endsWith('/')) {
    newPath += '/';
  }

  return newPath;
}

// ============================================
// PUBLIC API - PATH OPERATIONS
// ============================================

export function getRawPathname(pathname: string): string {
  if (!pathname || pathname === '/') return pathname;

  const { path, queryAndHash, params, hasLanguage } = parsePathname(pathname);

  if (!hasLanguage) return pathname;

  const remainingParams = params.slice(1);
  const preserveSlash = path.endsWith('/') && path !== `/${params[0]}/`;
  const newPath = buildPath(remainingParams, preserveSlash, path);

  return newPath + queryAndHash;
}

export function addLanguageToPath(
  pathname: string,
  lang: AvailableLanguage,
  options: PathOptions = {}
): string {
  if (shouldSkipPath(pathname, options)) {
    return pathname;
  }

  const { path, queryAndHash, hasLanguage, language } = parsePathname(pathname);
  const { preserveRootSlash = true } = options;

  // If already has language, replace it
  if (hasLanguage) {
    return path.replace(new RegExp(`^/${language}`), `/${lang}`) + queryAndHash;
  }

  // Add language preserving format
  let newPath: string;
  if (path === '/' && preserveRootSlash) {
    newPath = `/${lang}/`;
  } else {
    newPath = `/${lang}${path}`;
  }

  return newPath + queryAndHash;
}

export function langHref(href: string, locale: AvailableLanguage): string {
  // If it doesn't start with /, return as is
  if (!href.startsWith('/')) {
    return href;
  }

  return addLanguageToPath(href, locale, {
    skipExternal: true,
    skipStatic: true,
    preserveRootSlash: false,
  });
}

// ============================================
// SERVER MIDDLEWARE
// ============================================

export function langServerMiddleware(event: PageEvent): AvailableLanguage {
  const url = new URL(event.request.url);
  const { language } = parsePathname(url.pathname);
  return language;
}

// ============================================
// PROVIDER COMPONENT
// ============================================

export const LangProvider: Component<ParentProps> = (props) => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get current locale from URL params
  const locale = createMemo(() => {
    const langParam = params.lang;
    return (langParam && isAvailableLanguage(langParam) ? langParam : baseLocale) as AvailableLanguage;
  });

  // Handle client-side language detection and redirection
  const initializeClientLanguage = () => {
    const currentLang = params.lang;

    if (!currentLang || !isAvailableLanguage(currentLang)) {
      const browserLang = navigator.language.slice(0, 2);
      const targetLang = isAvailableLanguage(browserLang) ? browserLang : baseLocale;
      navigate(`/${targetLang}${location.pathname}`, { replace: true });
    }
  };

  // Create localized messages with caching
  const messageCache = new Map<string, Map<MessageKey, Function>>();

  const messages = createMemo(() => {
    const currentLocale = locale();

    // Get or create cache for current locale
    if (!messageCache.has(currentLocale)) {
      messageCache.set(currentLocale, new Map());
    }

    const localeCache = messageCache.get(currentLocale)!;
    const localizedMessages = {} as Record<MessageKey, Function>;

    // Wrap each message function with the current locale
    for (const key in m) {
      const messageKey = key as MessageKey;

      if (localeCache.has(messageKey)) {
        localizedMessages[messageKey] = localeCache.get(messageKey)!;
      } else {
        const originalFn = m[messageKey];

        // Create wrapped function that injects locale
        const wrappedFn = (inputArgs: {}, options: {}) => {
          // @ts-ignore - ignored to pass signature correctly
          return originalFn(inputArgs, { locale: currentLocale, ...options });
        };

        localeCache.set(messageKey, wrappedFn);
        localizedMessages[messageKey] = wrappedFn;
      }
    }

    return localizedMessages as ParaglideMessages;
  });

  // Update HTML lang attribute when locale changes
  createEffect(() => {
    document.documentElement.lang = locale();
  });

  // Navigate to new locale
  const setLocale = (newLocale: AvailableLanguage) => {
    const currentPath = getRawPathname(location.pathname);
    const newPath = addLanguageToPath(currentPath, newLocale);
    navigate(newPath);
  };

  // Initialize client language on mount
  createEffect(() => {
    if (typeof window !== 'undefined') {
      initializeClientLanguage();
    }
  });

  const contextValue: LangContextValue = {
    locale,
    messages,
    availableLocales: locales as unknown as AvailableLanguage[],
    setLocale,
  };

  return (
    <LangContext.Provider value={contextValue}>
      {props.children}
    </LangContext.Provider>
  );
};

// ============================================
// HOOKS
// ============================================

export function useLang(): LangContextValue {
  const context = useContext(LangContext);
  if (!context) {
    throw new Error('useLang must be used within a LangProvider');
  }
  return context;
}

// ============================================
// COMPONENTS
// ============================================

export const LangLink: Component<AnchorProps> = (props) => {
  const { locale } = useLang();
  // Destructure props to separate href from other props
  return (
    <A {...props} href={langHref(props.href || '', locale())}>
      {props.children}
    </A>
  );
};
