import { Client, Events, GatewayIntentBits } from 'discord.js'
import { config } from './config'
import { collect } from './collect'
import { Feed } from 'feed'
import * as fs from 'node:fs/promises'

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
] })

client.on(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}!`)
})

await client.login(config.discord.token)

const feed = new Feed(config.feed.options)
await collect(feed, client)
fs.writeFile('./out/rss.xml', feed.rss2())
fs.writeFile('./out/atom.xml', feed.atom1())

await client.destroy()
process.exit(0)
