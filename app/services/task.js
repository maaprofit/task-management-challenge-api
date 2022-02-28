const { Task } = require('../models')

const TaskService = {}

TaskService.taskList = async (
    limit = 10,
    orderBy = 'DESC',
    filterByRequester = null
) => {
    const where = {}

    if (!!filterByRequester) {
        where.requester_id = filterByRequester
    }

    return Task.findAll({
        where,
        order: [
            ['due_date', orderBy]
        ],
        limit,
    })
}

module.exports = TaskService