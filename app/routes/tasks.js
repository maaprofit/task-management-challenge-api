const router = require('express').Router()

// services:
const {
    taskList,
    taskCreate,
    taskDetails,
    taskUpdateStatus,
    taskDelete,
    taskFindById,
    taskRelateOwner,
    taskValidateChildren,
    taskFindParentByChildrenTaskId,
    taskFindChildrenByParentTaskId,
    taskCheckParentChildrenStatuses
} = require('../services/task')

const { userFindByName, userCreateOrFind } = require('../services/user')

// validators:
const { validate } = require('../validators/task')
const { validationResult } = require('express-validator')

router.get('/', async (req, res) => {
    try {
        const params = req.query

        const limit = params?.limit || 10
        const orderBy = params?.order_by || 'DESC'

        if (['ASC', 'DESC'].indexOf(orderBy.toUpperCase()) < 0) {
            return res.status(400).json({
                message: 'order_by must be ASC or DESC value'
            })
        }

        if (limit <= 0 || !Number.isInteger(limit)) {
            return res.status(400).json({
                message: 'limit must be greater than 0'
            })
        }

        let requester_id = params?.requester_id

        // if requester name is passed, get requester user id
        if (params.requester) {
            const user = await userFindByName(params.requester)

            if (!!user)
                requester_id = user.id
        }

        const list = await taskList(limit, orderBy, requester_id)

        res
            .status(200)
            .json({
                response: list,
            })
    } catch (e) {
        res
            .status(400)
            .json({ message: e })
    }
})

router.post('/', validate('create'), async (req, res) => {
    let insertedId = null

    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.array()
                    .map(item => item.msg)
            });
        }

        const body = req.body
        // create requester user registry:
        const requester_id = await userCreateOrFind(body.requester)

        const taskPayload = {
            title: body.title,
            description: body.description || '',
            // set initial status as 'to_do'
            status: 'to_do',
            due_date: body.due_date,
            requester_id,
        }

        const task = await taskCreate(taskPayload)

        // set id on payload to use on relations:
        taskPayload.id = task.id

        // set inserted id to delete task on catch:
        insertedId = task.id

        if (body.children && Array.isArray(body.children)) {
            await taskValidateChildren(body.children, taskPayload)
        }

        if (body.owners && Array.isArray(body.owners)) {
            for (const owner of body.owners) {
                const user_id = await userCreateOrFind(owner)

                if (user_id) {
                    // add relation between owner x task
                    await taskRelateOwner(task.id, user_id)
                }
            }
        }

        res
            .status(201)
            .json({
                message: 'task has been created',
                response: task.id,
            })
    } catch (errors) {
        // delete task on error
        if (insertedId) {
            await taskDelete(insertedId)
        }

        if (Array.isArray(errors)) {
            return res
                .status(422)
                .json({ errors })
        }

        throw errors
    }
})

router.get('/:id', async (req, res) => {
    try {
        if (req.params.id) {
            const details = await taskDetails(req.params.id)
            
            if (!details.task)
                return res.status(404).send()

            const { task, owners, children, parent } = details
            const { User } = task

            const response = {
                id: task.id,
                title: task.title,
                description: task.description,
                due_date: task.due_date,
                status: task.status,
                requester: {
                    id: User.id,
                    name: User.name,
                },
                owners,
                children,
                parent,
                created_at: task.created_at,
                modified_at: task.modified_at,
            }

            return res
                .status(200)
                .json({ response })
        }

        // In case no "id" is informed, return status 404 (not found)
        res.status(404).send()
    } catch (e) {
        console.error(e)
    }
})

router.put('/status/:id', validate('update'), async (req, res) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({
                errors: errors.array()
                    .map(item => item.msg)
            });
        }

        const task = await taskFindById(req.params.id)

        if (!task) {
            return res
                .status(404)
                .json({ message: 'task not found' })
        }

        if (task.status == 'done') {
            return res
                .status(400)
                .json({
                    message: 'task status is not able to change, because it is already done'
                })
        }

        const taskChildrens = await taskFindChildrenByParentTaskId(req.params.id)

        if (taskChildrens.length) {
            return res
                .status(400)
                .json({
                    message: 'in order to change parent status, you need to complete your children'
                })
        }

        await taskUpdateStatus(
            req.body.status,
            req.params.id
        )

        // search for task parent:
        const parent = await taskFindParentByChildrenTaskId(req.params.id)

        // check parent status, after its children update:
        if (parent)
            await taskCheckParentChildrenStatuses(parent.id)

        res
            .status(200)
            .json({ message: 'task status has been changed' })
    } catch (e) {}
})

module.exports = router