export const siteConfig = {
  name: 'IchMagTomaten',
  domain: 'j-bot.net',
  url: 'https://j-bot.net',
  email: 'ubztomaten@gmail.com',
  social: {
    github: 'https://github.com/IchMagTomatenn',
  },
  remark42: {
    host: import.meta.env.PUBLIC_REMARK42_HOST as string | undefined,
    siteId:
      (import.meta.env.PUBLIC_REMARK42_SITE_ID as string | undefined) ?? 'mywebspace',
  },
} as const;
