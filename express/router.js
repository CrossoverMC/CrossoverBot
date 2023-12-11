const express = require("express")
const { ChannelType } = require("discord.js")
const jsonDatabase = require("../json-database")
const { boothCategoryId, waitingBoothId } = require("../config.json")

const router = express.Router()

router.use("/", (req, res, next) => { // provide response method
    res.res = (responseCode, a, b) => {
        a ??= toString(responseCode)

        if (b == null) {
            let json

            if (typeof a === "object") {
                json = a
            } else { // assume string
                json = { statusMessage: a }
            }

            res.status(responseCode).json(json)
        } else {
            b.statusMessage = a
            res.status(responseCode).json(b)
        }
    }

    next()
})

router.post("/link", async (req, res) => {
    const { body, client, guild } = req
    const { code, username: minecraftUsername, uuid } = body
    const links = jsonDatabase.get(jsonDatabase.LINKS_PATH)

    for (let userId in links) {
        const minecraftUuid = links[userId]

        if (minecraftUuid === uuid) {
            res.res(409, "already_linked")
            return
        }
    }

    const linking = jsonDatabase.get(jsonDatabase.LINKING_PATH)

    for (let userId in linking) {
        const linkingCode = linking[userId]

        if (linkingCode === code) {
            jsonDatabase.delete(jsonDatabase.LINKING_PATH + "." + userId)
            jsonDatabase.set(jsonDatabase.LINKS_PATH + "." + userId, uuid)

            const member = await guild.members.fetch(userId)
            client.emit("minecraftAccountLinked", member)
            member.send("Your account has been linked to the Minecraft account `" + minecraftUsername + "`.").catch()
            res.res(200, "success", { discordUsername: member.user?.username })
            return
        }
    }

    res.res(400, "invalid_code")
})

router.post("/unlink", async (req, res) => {
    const { body, client, guild } = req
    const { username: minecraftUsername, uuid } = body
    const links = jsonDatabase.get(jsonDatabase.LINKS_PATH)

    let discordUserId = null

    for (let userId in links) {
        const minecraftUuid = links[userId]

        if (minecraftUuid === uuid) {
            discordUserId = userId
            break
        }
    }

    if (!discordUserId) {
        res.res(409, "not_linked")
        return
    }

    jsonDatabase.delete(jsonDatabase.LINKS_PATH + "." + discordUserId)

    const member = await guild.members.fetch(discordUserId)
    client.emit("minecraftAccountUnlinked", member)
    member.send("Your account has been unlinked from the Minecraft account `" + minecraftUsername + "`.").catch()
    res.res(200, "success", { discordUsername: member.user?.username })
})

router.post("/unlink", async (req, res) => {
    const { body, client, guild } = req
    const { username: minecraftUsername, uuid } = body
    const links = jsonDatabase.get(jsonDatabase.LINKS_PATH)

    let discordUserId = null

    for (let userId in links) {
        const minecraftUuid = links[userId]

        if (minecraftUuid === uuid) {
            discordUserId = userId
            break
        }
    }

    if (!discordUserId) {
        res.res(409, "not_linked")
        return
    }

    jsonDatabase.delete(jsonDatabase.LINKS_PATH + "." + discordUserId)

    const member = await guild.members.fetch(discordUserId)
    client.emit("minecraftAccountUnlinked", member)
    member.send("Your account has been unlinked from the Minecraft account `" + minecraftUsername + "`.").catch()
    res.res(200, "success", { discordUsername: member.user?.username })
})

router.put("/update-booths", async (req, res) => {
    const { body, guild } = req
    const { booths: boothIds } = body

    let asyncTasks = []

    // delete previous
    jsonDatabase.delete(jsonDatabase.BOOTH_CHANNELS_PATH)

    guild.channels.cache.forEach(channel => {
        if (channel.type === ChannelType.GuildVoice && channel.parentId === boothCategoryId && channel.id !== waitingBoothId) {
            const promise = channel.delete()
            asyncTasks.push(promise)
        }
    })

    try {
        await Promise.all(asyncTasks)
    } catch {
        console.warn("Error deleting booth voice channels")
        res.res(500)
        return
    }

    // create new
    if (boothIds.length > 0) {
        const channelIdSaves = {}
        asyncTasks = []

        for (let boothId of boothIds.split(",")) {
            const promise = guild.channels.create({
                name: "Booth",
                type: ChannelType.GuildVoice,
                parent: boothCategoryId
            }).then(channel => channelIdSaves[boothId] = channel.id)

            asyncTasks.push(promise)
        }

        try {
            await Promise.all(asyncTasks)
        } catch {
            console.warn("Error creating booth voice channels")
            res.res(500)
            return
        }

        jsonDatabase.set(jsonDatabase.BOOTH_CHANNELS_PATH, channelIdSaves)
    }

    res.res(200, "success")
})

router.put("/voice-booth", async (req, res) => {
    const { body, guild } = req
    const { booth: boothId, user: minecraftUserUuid } = body

    const links = jsonDatabase.get(jsonDatabase.LINKS_PATH)
    let discordUserId

    for (let userId in links) {
        const userMinecaftUuid = links[userId]

        if (userMinecaftUuid === minecraftUserUuid) {
            discordUserId = userId
            break
        }
    }

    if (!discordUserId) {
        res.res(409, "not_linked")
        return
    }

    const member = await guild.members.fetch(discordUserId)
    const { voice } = member

    if (!voice.channel || voice.channel.parentId !== boothCategoryId) {
        res.res(409, "user_unready")
        return
    }

    let voiceChannelId

    if (boothId === "none") {
        voiceChannelId = waitingBoothId
    } else {
        voiceChannelId = jsonDatabase.get(jsonDatabase.BOOTH_CHANNELS_PATH + "." + boothId)

        if (!voiceChannelId) {
            res.res(500)
            return
        }
    }

    const voiceChannel = guild.channels.cache.get(voiceChannelId)

    try {
        await voice.setChannel(voiceChannel)
        res.res(200, "success")
    } catch {
        console.warn("Error joining channel: " + voiceChannelId)
        res.res(500)
    }
})

module.exports = router