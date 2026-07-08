export const languages = {
  de: 'Deutsch',
  en: 'English',
};

export const defaultLang = 'de';

export const ui = {
  de: {
    'site.title': 'IchMagTomaten',
    'site.tagline': 'Projekte, Blog & Notizen',
    'nav.home': 'Start',
    'nav.projects': 'Projekte',
    'nav.blog': 'Blog',
    'nav.guestbook': 'Gästebuch',
    'nav.contact': 'Kontakt',
    'nav.theme.toggle': 'Theme wechseln',
    'nav.lang.toggle': 'Sprache wechseln',
    'footer.built_with': 'Gebaut mit Astro',
    'footer.rights': 'Alle Rechte vorbehalten.',
    'home.hero.greeting': 'Hallo, ich bin',
    'home.hero.name': 'IchMagTomaten',
    'home.hero.subtitle':
      'Entwickler, Bastler und Freund von Tomaten. Hier teile ich Projekte, Notizen und Gelegentliches aus meinem Werkzeugkasten.',
    'home.cta.projects': 'Meine Projekte ansehen',
    'home.cta.blog': 'Zum Blog',
    'home.cta.contact': 'Kontakt aufnehmen',
    'home.about.title': 'Über mich',
    'home.about.body':
      'Ich experimentiere gerne mit Web-Technologien, kleinen Tools und automatisierten Spielzeugen. Diese Seite sammelt, was dabei herauskommt.',
    'home.skills.title': 'Werkzeugkasten',
    'home.skills.subtitle': 'Ein paar Technologien, mit denen ich arbeite',
  },
  en: {
    'site.title': 'IchMagTomaten',
    'site.tagline': 'Projects, blog & notes',
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.guestbook': 'Guestbook',
    'nav.contact': 'Contact',
    'nav.theme.toggle': 'Toggle theme',
    'nav.lang.toggle': 'Switch language',
    'footer.built_with': 'Built with Astro',
    'footer.rights': 'All rights reserved.',
    'home.hero.greeting': 'Hi, I am',
    'home.hero.name': 'IchMagTomaten',
    'home.hero.subtitle':
      'Developer, tinkerer and friend of tomatoes. Here I share projects, notes and the occasional thing from my toolbox.',
    'home.cta.projects': 'View my projects',
    'home.cta.blog': 'Go to blog',
    'home.cta.contact': 'Get in touch',
    'home.about.title': 'About me',
    'home.about.body':
      'I enjoy experimenting with web tech, small tools and automated toys. This site collects what comes out of it.',
    'home.skills.title': 'Toolbox',
    'home.skills.subtitle': 'A few technologies I work with',
  },
} as const;

export type Lang = keyof typeof ui;
export type TranslationKey = keyof (typeof ui)['de'];
