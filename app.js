const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const app = express()
module.exports=app
app.use(express.json())
let db = null
const pathDB = path.join(__dirname, 'userData.db')

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: pathDB,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB ERROR: ${error.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const userRegisterQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(userRegisterQuery)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUserQuery = `INSERT INTO user (username, name, password, gender, location) VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`
      const createUser = await db.run(createUserQuery)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const isUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(isUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isUserPassword = await bcrypt.compare(password, dbUser.password)
    if (isUserPassword === false) {
      response.status(400)
      response.send('Invalid password')
    } else {
      response.status(200)
      response.send('Login success!')
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const isUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(isUserQuery)
  const oldPwd = await bcrypt.compare(oldPassword, dbUser.password)
  if (oldPwd === false) {
    response.status(400)
    response.send('Invalid current password')
  } else {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const changePwd = `UPDATE user SET username='${username}',password='${hashedPassword}';`
      await db.run(changePwd)
      response.status(200)
      response.send('Password updated')
    }
  }
})
