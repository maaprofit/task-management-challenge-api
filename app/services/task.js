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

TaskService.taskFindParentByChildrenTaskId = async (id) => {
    try {
        const q = `SELECT t.id, t.title, t.status FROM tasks_childrens tc JOIN tasks t ON tc.parent_id = t.id WHERE tc.children_id = ${id} LIMIT 1`
        const parent = await sequelize.query(q, {
            type: Sequelize.QueryTypes.SELECT
        })

        if (parent && parent.length) {
            return parent[0]
        }
    } catch (error) {
        throw error;
    }
}

TaskService.taskFindChildrenByParentTaskId = id => {
    return TasksChildren.findAll({
        where: { parent_id: id },
        include: Task
    })
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

    const children = await TaskService
        .taskFindChildrenByParentTaskId(id)

    // set children list (id, title):
    payload.children = children.map(child => ({
        id: child.Task.id,
        title: child.Task.title
    }))

    // search for task parent:
    const parent = await TaskService.taskFindParentByChildrenTaskId(id)

    if (parent) {
        payload.parent = {
            id: parent.id,
            title: parent.title,
        }
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

TaskService.taskCheckParentChildrenStatuses = async (parentId) => {
    const parent = await Task.findByPk(parentId)
    const children = await TasksChildren.findAll({
        where: { parent_id: parentId },
        include: Task
    })

    const childrenDoingState = children
        .filter(child => child.Task.status == 'doing')

    const childrenDoneState = children
        .filter(child => child.Task.status == 'done')

    let parentStatus = parent.status

    if (childrenDoingState.length > 0)
        parentStatus = 'doing'

    if (childrenDoneState.length == children.length)
        parentStatus = 'done'

    return Task.update({ status: parentStatus }, {
        where: {
            id: parent.id
        }
    })
}

TaskService.taskValidateChildren = async (children, task) => {
    let childIndex = 0
    let childToCreate = []
    let childToRelate = []

    for (const child of children) {
        let childId = child?.id

        if (!!childId) {
            const childDetails = await TaskService.taskFindById(childId)

            if (!childDetails) {
                return Promise
                    .reject([`child task (index: ${childIndex}) does not exists`])
            }

            const childrenFromChild = await TaskService
                .taskFindChildrenByParentTaskId(childId)

            const parents = await TasksChildren.findAll({
                where: {
                    children_id: childId
                }
            })

            if (childDetails.status == 'done') {
                return Promise
                    .reject([`child task (index: ${childIndex}) is already in done state`])
            }

            if (parents.length > 0 || childrenFromChild.length > 0) {
                return Promise
                    .reject([`child task (index: ${childIndex}) is already linked with another task`])
            }

            childToRelate.push(childId)
        } else {
            // validate task title
            if (!child.title || child.title == '') {
                return Promise
                    .reject([`child task (index: ${childIndex}) must contain title`])
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
            childToCreate.push({
                title: child.title,
                description: child?.description || '',
                status: 'to_do',
                // check if a due_date is passed inside child object
                due_date: child.due_date
                    ? child.due_date
                    : task.due_date,
                requester_id: task.requester_id,
            })
        }

        childIndex++
    }

    // on the end of iteration, create children tasks relations
    for (const payload of childToCreate) {
        const childTask = await TaskService.taskCreate(payload) 
        // set into child to relate array:
        childToRelate.push(childTask.id)
    }

    for (const relationId of childToRelate) {
        if (task.id !== relationId) {
            await TaskService.taskRelateChild(task.id, relationId)
        }
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

TaskService.taskDelete = async (id) => {
    // remove parent relation with children:
    await TasksChildren.destroy({
        where: {
            parent_id: id
        }
    })

    // remove children relation with parent:
    await TasksChildren.destroy({
        where: {
            children_id: id
        }
    })

    // remove owners relation:
    await TasksOwner.destroy({
        where: {
            task_id: id,
        }
    })

    return Task.destroy({
        where: { id }
    })
}

module.exports = TaskService