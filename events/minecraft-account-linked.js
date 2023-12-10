const { linkedRoleId } = require("../config.json")

module.exports = {
    name: "minecraftAccountLinked",
    async execute(member) {
        // add role
        const role = await member.guild.roles.fetch(linkedRoleId)
        member.roles.add(role)
    }
}