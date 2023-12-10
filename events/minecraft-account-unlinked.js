const { boothCategoryId, linkedRoleId } = require("../config.json")

module.exports = {
    name: "minecraftAccountUnlinked",
    async execute(member) {
        const { guild, voice } = member

        if (voice.channel && voice.channel.parentId === boothCategoryId) {
            voice.setChannel(null)
        }

        // remove role
        const role = await guild.roles.fetch(linkedRoleId)
        member.roles.remove(role)
    }
}