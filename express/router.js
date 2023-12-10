const express = require("express")
const { ChannelType } = require("discord.js")
const jsonDatabase = require("../json-database")
const { boothCategoryId, waitingBoothId } = require("../config.json")

const router = express.Router()

router.use("/", (req, res, next) => { // provide response method
    res.res = (responseCode, a, b) => {
        if (a == null) {
            res.sendStatus(responseCode)
        } else if (b == null) {
            let json

            if (typeof a === "string") {
                json = { statusMessage: a }
            } else {
                json = a
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

const userTasks = {}

router.put("/voice-booth", async (req, res) => {
    const { body, client, guild } = req
    const { booth: boothId, user: minecraftUserUuid } = body
    const { booths } = client

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

    let promiseResolve
    const taskPromise = new Promise(r => promiseResolve = r)

    let userSpecificTasks = userTasks[minecraftUserUuid]
    if (!userSpecificTasks) userSpecificTasks = userTasks[minecraftUserUuid] = []

    const previousUserTasks = [...userSpecificTasks]
    userSpecificTasks.push(taskPromise)
    await Promise.all([...previousUserTasks])

    let voiceChannel

    if (boothId === "none") {
        voiceChannel = guild.channels.cache.get(waitingBoothId)
    } else {
        voiceChannel = booths[boothId]

        if (!voiceChannel) {
            try {
                voiceChannel = booths[boothId] = await guild.channels.create({
                    name: "Booth",
                    type: ChannelType.GuildVoice,
                    parent: boothCategoryId
                })

                await new Promise(r => setTimeout(r, 2000))
            } catch {
                console.warn("Error creating channel: " + boothId)
                res.res(500)
                return
            }
        }
    }

    promiseResolve()
    userSpecificTasks.splice(userSpecificTasks.indexOf(taskPromise), 1)

    try {
        console.log("joining: " + voiceChannel.id)
        await voice.setChannel(voiceChannel)
        res.res(200, "success")
    } catch {
        console.warn("Error joining channel: " + voiceChannel.id)
        res.res(500)
    }
})

module.exports = router