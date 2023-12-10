const fs = require("fs")
const path = require("path")
const express = require("express")
const expressRouter = require("./express/router")
const { Client, Collection, GatewayIntentBits } = require("discord.js")
const { guildId, token } = require("./config.json")

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates
	]
})

/* Commands */

client.booths = {}
client.commands = new Collection()

const foldersPath = path.join(__dirname, "commands")
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder)
	const commandFiles = fs.readdirSync(commandsPath)

	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file)
		const command = require(filePath)

		if ("data" in command && "execute" in command) {
			client.commands.set(command.data.name, command)
		} else {
			console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" properties.`)
		}
	}
}

/* Events */

const eventsPath = path.join(__dirname, "events")
const eventFiles = fs.readdirSync(eventsPath)

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file)
	const event = require(filePath)

	if (event.includeClient) {
		if (event.once) {
			client.once(event.name, (...args) => event.execute(client, ...args))
		} else {
			client.on(event.name, (...args) => event.execute(client, ...args))
		}
	} else {
		if (event.once) {
			client.once(event.name, event.execute)
		} else {
			client.on(event.name, event.execute)
		}
	}
}

/* Presence */

client.login(token)

/* Express */

const expressServer = express()
const EXPRESS_PORT = 8080

expressServer.use(require("body-parser").json())

expressServer.use("/", (req, res, next) => {
	req.client = client
	req.guild = client.guilds.cache.get(guildId)
	next()
}, expressRouter)

expressServer.listen(EXPRESS_PORT, "127.0.0.1", () => {
	console.info("Express server listening on port " + EXPRESS_PORT)
})