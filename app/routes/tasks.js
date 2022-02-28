const router = require('express').Router()
const { taskList } = require('../services/task') 
const { findByName } = require('../services/user')

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

        if (limit <= 0) {
            return res.status(400).json({
                message: 'limit must be greater than 0'
            })
        }

        let requester_id = params?.requester_id

        if (params.requester) {
            const user = await findByName(params.requester)

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

router.post('/', (req, res) => {

})

router.get('/:id', (req, res) => {})

// payload example: { status: "to_do" }
router.put('/status', (req, res) => {})

module.exports = router