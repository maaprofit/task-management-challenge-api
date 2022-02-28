const { body } = require('express-validator')
const statusEnum = ['to_do', 'doing', 'done']

exports.validate = method => {
    switch (method) {
        case 'create':
            return [
                body('title', 'Task title must be informed').notEmpty(),
                body('title', 'Task title must be no longer than 80 characters')
                    .custom((value) => {
                        return (value.length <= 80)
                    }),
                body('description', 'Task description must not be empty')
                    .optional()
                    .notEmpty(),
                body('due_date', 'Task due_date must not be empty')
                    .notEmpty(),
                body('due_date', 'Task due_date must be a valid date (YYYY-MM-DD HH:mm:ss)')
                    .isISO8601()
                    .toDate(),
                body('requester_id', 'Task requester_id must not be empty')
                    .notEmpty()
            ]
        case 'update':
            return [
                body('status', 'Task status must be informed').notEmpty(),
                body('status', 'Task status must be one of the options: to_do / doing / done')
                    .custom((value) => (statusEnum.indexOf(value) >= 0))
            ]
    }
}