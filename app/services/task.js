const {
    Task,
    TasksOwner,
    TasksChildren,
    User,
    sequelize,
    Sequelize,
} = require('../models')

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

TaskService.taskFindById = (id, options) => {
    return Task.findByPk(id, options)
}

TaskService.taskDetails = async (id) => {
    const task = await TaskService.taskFindById(id, {
        include: [User]
    })

    const payload = { task }

    const owners = await TasksOwner.findAll({
        where: { task_id: id },
        include: User
    })

    // set owners list (id, name):
    payload.owners = owners.map(owner => ({
        id: owner.User.id,
        name: owner.User.name,
    }))

    const children = await TasksChildren.findAll({
        where: { parent_id: id },
        include: Task
    })

    // set children list (id, title):
    payload.children = children.map(child => ({
        id: child.Task.id,
        title: child.Task.title
    }))

    const q = `SELECT t.id, t.title FROM tasks_childrens tc JOIN tasks t ON tc.parent_id = t.id WHERE tc.children_id = ${id} LIMIT 1`
    const parent = await sequelize.query(q, {
        type: Sequelize.QueryTypes.SELECT
    })

    // set parent object (id, title):
    if (parent && parent.length) {
        payload.parent = parent[0]
    }

    return payload
}

// creating a new task for requester
TaskService.taskCreate = async (payload) => {
    return Task.create(payload)
}

TaskService.taskUpdateStatus = async (status, id) => {
    return Task.update({ status }, {
        where: { id }
    })
}


TaskService.taskValidateChildren = async (children, task) => {
    let childIndex = 0

    for (const child of children) {
        let childId = child?.id

        // @todo: validate child parent's

        if (!child?.id || child?.id == '') {
            // validate task title
            if (!child.title || child.title == '') {
                return Promise
                    .reject([`task child (index: ${childIndex}) must contain title`])
            }

            if (child.due_date && child.due_date) {
                const parentDueDate = new Date(task.due_date)
                const childDueDate = new Date(child.due_date)

                if (childDueDate > parentDueDate) {
                    return Promise
                        .reject([`task child (index: ${childIndex}) due_date must not be after parent task due_date`])
                }
            }

            // create child task to relate them:
            const childTask = await TaskService.taskCreate({
                title: child.title,
                description: child?.description || '',
                status: 'to_do',
                // check if a due_date is passed inside child object
                due_date: child.due_date
                    ? child.due_date
                    : task.due_date,
                requester_id: task.requester_id,
            })

            // set child created
            childId = childTask.id
        }

        await TaskService.taskRelateChild(task.id, childId)

        childIndex++
    }
}

TaskService.taskRelateOwner = (task_id, user_id) => {
    return TasksOwner.create({
        user_id,
        task_id
    })
}

TaskService.taskRelateChild = (parent_id, children_id) => {
    return TasksChildren.create({
        parent_id,
        children_id
    })
}


module.exports = TaskService