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

UserService.userCreateOrFind = async (name) => {
    try {
        const createdUser = await User.findOrCreate({
            where: { name },
            defaults: { name }
        })
    
        if (createdUser && createdUser.length)
            return Promise.resolve(createdUser[0].id)
    } catch (error) {
        return Promise.reject('User could not be created')
    }
}

UserService.userFindByName = async (name) => {
    return User.findOne({
        where: { name }
    })
}

module.exports = UserService