import type { FeedOptions } from "feed"

export type Config = {
  discord: {
    token: string
    guildId: string
  }
  feed: {
    options: FeedOptions
  }
  channels: Array<{
    id: string
    name: string
    frequency: 'daily'
  }>
}

//

const host = 'https://knabber.maanex.me/'

export const config: Config = {
  discord: {
    token: String(process.env.DISCORD_TOKEN),
    guildId: '1338149752671572039'
  },
  feed: {
    options: {
      title: 'Forg House',
      copyright: `Copyright (c) ${new Date().getFullYear()} Andreas May`,
      description: 'Feeds from the Forg House Discord server :D',
      id: host,
      link: host,
      language: 'en',
      generator: 'Knabber',
      feedLinks: {
        rss: `${host}rss.xml`,
        atom: `${host}atom.xml`
      },
      author: {
        name: 'Andreas May',
        email: 'andreas@maanex.me',
        link: 'https://maanex.me'
      },
      image: 'https://cdn.discordapp.com/icons/1338149752671572039/b2fe80737fbc86cd5309dabd69f8c2be.png?size=80&quality=lossless'
    }
  },
  channels: [
    {
      id: '1338153602207711282',
      name: 'FreeStuff',
      frequency: 'daily'
    },
    {
      id: '1338153124270968923',
      name: 'Home Things',
      frequency: 'daily'
    },
    {
      id: '1338154174243672136',
      name: 'Random',
      frequency: 'daily'
    }
  ]
}
