import type { Feed } from "feed"
import { config, type Config } from "./config"
import { Guild, MessageType, type Client, type GuildTextBasedChannel } from "discord.js"


function escapeStringContent(content: string) {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\[|\]/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
}

const userMentionRegex = /&lt;@(\d+)&gt;/g
const channelMentionRegex = /&lt;#(\d+)&gt;/g

async function formatTextContent(content: string, guild: Guild) {
  const withLinks = content.replace(/https?:\/\/\S+/g, url => `<a href="${url}">${url}</a>`)

  const users = withLinks.matchAll(userMentionRegex).toArray()
  for (const user of users)
    await guild.members.fetch(user[1])
  const channels = withLinks.matchAll(channelMentionRegex).toArray()
  for (const channel of channels)
    await guild.channels.fetch(channel[1])

  const withUserResolved = withLinks.replace(userMentionRegex, (_, id) => {
    const user = guild.members.cache.get(id)?.displayName
    return user ? `@${user}` : '@...'
  })
  const withChannelResolved = withUserResolved.replace(channelMentionRegex, (_, id) => {
    const channel = guild.channels.cache.get(id)?.name
    return channel ? `#${channel}` : '#...'
  })
  const withEmojisResolved = withChannelResolved.replace(/&lt;a?:(\w+):(\d+)&gt;/g, (_, name, id) => `<a href="https://cdn.discordapp.com/emojis/${id}.webp">:${name}:</a>`)
  return `<p>${withEmojisResolved}<p>`
}

async function collectChannel(channel: Config['channels'][number], feed: Feed, client: Client) {
  const data = await client.channels.fetch(channel.id) as GuildTextBasedChannel | null
  if (!data?.isTextBased())
    return

  const allMessages = await data.messages.fetch({ limit: 50 })

  const messagesGrouped = Object.groupBy(allMessages.values(), m => new Date(m.createdTimestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
  for (const [ dateString, messages ] of Object.entries(messagesGrouped)) {
    const messagesFiltered = messages
      ?.filter(m => (m.type === MessageType.Default || m.type === MessageType.Reply))
      .toReversed()
    if (!messagesFiltered?.length)
      continue

    const date = new Date(messagesFiltered.at(-1)!.createdTimestamp)
    const authors = new Set(messagesFiltered.map(m => m.author.displayName))
    const content = []
    let lastTime = messagesFiltered[0].createdTimestamp
    let lastCommunicatedTime = messagesFiltered[0].createdTimestamp

    for (const message of messagesFiltered) {
      const minutesAgo = (message.createdTimestamp - lastTime) / 60_000
      if (minutesAgo > 60 || !content.length) {
        content.push(`${content.length ? '<br>' : ''}<h1>${message.createdAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'shortGeneric' })}</h1>`)
        lastCommunicatedTime = message.createdTimestamp
      } else if (minutesAgo > 10) {
        content.push(`<br><h5>${Math.round((message.createdTimestamp - lastCommunicatedTime) / 60_000)} minutes later</h5>`)
        lastCommunicatedTime = message.createdTimestamp
      }
      lastTime = message.createdTimestamp

      if (message.content) {
        const escaped = escapeStringContent(message.content)
        if (escaped)
          content.push(await formatTextContent(escaped, data.guild))
      }
      if (message.attachments.size) {
        for (const attachment of message.attachments.values()) {
          if (attachment.contentType?.startsWith('image'))
            content.push(`<img src="${attachment.url}" alt="${attachment.name}">`)
          else
            content.push(`<a href="${attachment.url}">${attachment.name}</a>`)
        }
      }
    }

    feed.addItem({
      title: `${channel.name} - ${dateString}`,
      id: `${config.feed.options.id}${channel.id}/${dateString}`,
      link: `https://discord.com/channels/${config.discord.guildId}/${channel.id}`,
      description: `${messagesFiltered.length} messages from #${data.name}`,
      author: [...authors].map(name => ({ name })),
      content: content.join('\n'),
      date
    })
  }
}

export async function collect(feed: Feed, client: Client) {
  for (const channel of config.channels)
    await collectChannel(channel, feed, client)
}
