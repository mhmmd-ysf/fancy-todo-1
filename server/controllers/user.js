const { User } = require('../models')
const { hash } = require('../helpers/bcryptjs')
const { compare } = require('../helpers/bcryptjs')
const { sign } = require('../helpers/jwt')
const { google } = require('../helpers/google')

class ControllerUser {
  static create(req, res) {
    let { name, email, password } = req.body
    let newUser = {
      name, email,
      password: hash(password)
    }
    User.create(newUser)
      .then(data => {
        res.status(201).json({ data })
      })
      .catch(err => res.status(500).json({ message: err.message }))
  }
  static findAll(req, res) {
    User.find()
      .then(data => {
        res.status(200).json(data)
      })
      .catch(err => res.status(500).json({message: err.message}))
  }
  static findOne(req, res) {
    User.findOne({_id: req.params.id})
      .then(user => {
        res.status(200).json(user)
      })
      .catch(err => {res.status(500).json({message: err.message})})
  }
  static update(req, res) {
    User.findOneAndUpdate({_id: req.params.id}, req.body, { new: true })
    .then(user => {
      res.status(200).json(user)
    })
    .catch(err => res.status(500).json({message: err.message}))
  }
  static delete(req, res) {
    User.findOneAndDelete({_id: req.params.id})
      .then(user => {
        const response = {
          message: 'Successfully deleted user.',
          id: req.params.id
        }
        res.status(200).json(response)
      })
      .catch(err => {res.status(500).json({message: err.message})})
  }
  static login(req, res) {
    let { email, password } = req.body
    User.findOne({ email })
      .then(user => {
        if (!user) {
          res.status(401).json({ message: 'user tidak ada/ password salah' })
        } else {
          if (!compare(password, user.password)) {
            res.status(401).json({ message: 'user tidak ada/ password salah' })
          } else {
            let obj = {
              id: user._id,
            }
            let token = sign(obj)
            res.status(201).json({ 
              token,
              id: user._id,
              email,
              name: user.name,
              todos: user.todos
            })
          }
        }
      })
      .catch(err => {
        res.status(500).json({ err: err.message })
      })
  }
  static googleLogin(req, res) {
    let { token } = req.headers
    let payload
    google(token)
      .then(ticket => {
        payload = ticket.getPayload()
        return User.findOne({ email: payload.email })
      })
      .then(user => {
        let { name, email, picture } = payload
        if(!user) {
          return User.create({ name, email, password: 'password' })
        } else {
          return user
        }
      })
      .then(user => {
        let token = sign({
          id: user._id,
          name: user.name,
          email: user.email,
          picture: payload.picture
        })
        res.status(200).json({
          message: 'Logged In',
          id: user._id,
          token,
          name: user.name,
          email: user.email
        })
      })
      .catch(error => {
        console.log({ error })
        res.status(500).json({ error })
      })
  }
}

module.exports = ControllerUser