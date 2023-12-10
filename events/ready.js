const { Events } = require("discord.js")

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.info(`Discord bot ready. Logged in as ${client.user.tag}`)
    }
}