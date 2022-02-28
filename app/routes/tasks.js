const router = require('express').Router()
const { taskList } = require('../services/task') 

router.get('/', async (req, res) => {
    try {
        const list = await taskList()

        res
            .status(200)
            .json({
                response: list,
            })
    } catch (e) {
    }
})

router.post('/', (req, res) => {

})

router.get('/:id', (req, res) => {})

// payload example: { status: "to_do" }
router.put('/status', (req, res) => {})

module.exports = router