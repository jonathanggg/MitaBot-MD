import db from '../lib/database.js'

let handler = m => m

handler.before = async function (m, { conn, isBotAdmin }) {
  if (!m.isGroup) return false

  const chat = global.db.data.chats[m.chat]
  if (!isBotAdmin || !chat.antifake) return false

  const fakePrefixes = [
    '6',
    '90',
    '212',
    '92',
    '93',
    '94',
    '7',
    '49',
    '2',
    '91',
    '48'
  ]

  const isFake = fakePrefixes.some(prefix =>
    m.sender.startsWith(prefix)
  )

  if (isFake) {
    global.db.data.users[m.sender] =
      global.db.data.users[m.sender] || {}

    global.db.data.users[m.sender].block = true

    await conn.groupParticipantsUpdate(
      m.chat,
      [m.sender],
      'remove'
    )
  }

  return true
}

export default handler
