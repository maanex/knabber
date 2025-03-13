import { Client, Events, GatewayIntentBits } from 'discord.js'
import { config } from './config'
import { collect } from './collect'
import { Feed } from 'feed'
import * as fs from 'node:fs/promises'

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
] })

const { promise: clientReady, resolve } = Promise.withResolvers()
client.on(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}!`)
  resolve()
})

await client.login(config.discord.token)
await clientReady

const feed = new Feed(config.feed.options)
await collect(feed, client)

const cwd = process.cwd()
console.log('CWD', cwd)
fs.writeFile(`${cwd}/out/feed`, feed.rss2())
fs.writeFile(`${cwd}/out/rss.xml`, feed.rss2())
fs.writeFile(`${cwd}/out/atom.xml`, feed.atom1())

console.log('Done')
await client.destroy()
process.exit(0)
