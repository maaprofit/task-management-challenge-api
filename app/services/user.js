const { User } = require('../models')

const UserService = {}

UserService.userCreate = async (name) => {
    const usersWithChosenName = await User.findAll({
        where: { name }
    })

    if (usersWithChosenName.length > 0)
        return Promise.reject('user with the chosen name already exists')

    return User.create({ name })
}

UserService.userCreateOrFind = (name) => {
    return User.findOrCreate({
        where: { name },
        defaults: { name }
    })
}

UserService.userFindByName = async (name) => {
    return User.findOne({
        where: { name }
    })
}

module.exports = UserService