const { Events } = require("discord.js")
const { boothCategoryId, waitingBoothId } = require("../config.json")

module.exports = {
    name: Events.VoiceStateUpdate,
    includeClient: true,
    execute(client, oldState, newState) {
        const { booths } = client
        const { guild, channelId: oldChannelId } = oldState

        if (!oldChannelId) return

        const oldVoiceChannel = guild.channels.cache.get(oldChannelId)

        if (oldVoiceChannel.parentId === boothCategoryId && oldVoiceChannel.members.size === 0 && oldChannelId !== waitingBoothId) {
            for (let key in booths) {
                const boothVoiceChannel = booths[key]

                if (boothVoiceChannel === oldVoiceChannel) {
                    delete booths[key]
                    break
                }
            }

            oldVoiceChannel.delete().catch(() => console.warn("Error deleting channel: " + oldChannelId))
        }
    }
}