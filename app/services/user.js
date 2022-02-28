const { User } = require('../models')

const UserService = {}

UserService.create = async (name) => {
    const usersWithChosenName = await User.findAll({
        where: { name }
    })

    if (usersWithChosenName.length > 0)
        return Promise.reject('user with the chosen name already exists')

    return User.create({ name })
}

UserService.findByName = async (name) => {
    return User.findOne({
        where: { name }
    })
}

module.exports = UserService