// import app (to load server)
const { app } = require('../app')

const userService = require('./user')
const taskService = require('./task')

const request = require('supertest');

// set timeout value
jest.setTimeout(10000)

let taskWithoutChildrenId = null
let taskWithChildrenId = null
let userName = 'jest'

describe('test: create task', () => {
    it('should create jest user into database', async () => {
        // search for user requester id:
        let user = await userService.userFindByName(userName)

        if (!user) {
            const createdUserId = await userService
                .userCreateOrFind(userName)

            user = { id: createdUserId }
        }

        expect(user.id).toBeGreaterThan(0);
    })

    it('should require title on create request', (done) => {
        // create a due_date with one hour ahead:
        const due_date = ((new Date()).getTime() + (1 * 60 * 60 * 1000))

        const payload = {
            due_date: new Date(due_date).toISOString(),
            requester: userName
        }

        request(app)
            .post('/tasks')
            .send(payload)
            .set('Accept', 'application/json')
            .expect(422)
            .end((err, result) => {
                if (err) done(err)
                // has message validation:
                const messageValidation = result.body.errors
                    .some(error => error == 'Task title must be informed')
                // set expectation to be truthy
                expect(messageValidation).toBeTruthy()
                // end test:
                done()
            })
    })

    it('should require due_date on create request', (done) => {
        const payload = {
            requester: userName
        }

        request(app)
            .post('/tasks')
            .send(payload)
            .set('Accept', 'application/json')
            .expect(422)
            .end((err, result) => {
                if (err) done(err)
                // has message validation:
                const messageValidation = result.body.errors
                    .some(error => error == 'Task due_date must not be empty')
                // set expectation to be truthy
                expect(messageValidation).toBeTruthy()
                // end test:
                done()
            })
    })

    it('should require due_date to be a valid ISO date on create request', (done) => {
        const payload = {
            title: 'Task: Invalid due_date',
            due_date: '2022-03-11 09:79:00',
            requester: userName
        }

        request(app)
            .post('/tasks')
            .send(payload)
            .set('Accept', 'application/json')
            .expect(422)
            .end((err, result) => {
                if (err) done(err)
                // has message validation:
                const messageValidation = result.body.errors
                    .some(error => error == 'Task due_date must be a valid date (YYYY-MM-DD HH:mm:ss)')
                // set expectation to be truthy
                expect(messageValidation).toBeTruthy()
                // end test:
                done()
            })
    })

    it('should require requester on create request', (done) => {
        const payload = {}

        request(app)
            .post('/tasks')
            .send(payload)
            .set('Accept', 'application/json')
            .expect(422)
            .end((err, result) => {
                if (err) done(err)
                // has message validation:
                const messageValidation = result.body.errors
                    .some(error => error == 'Task requester must not be empty')
                // set expectation to be truthy
                expect(messageValidation).toBeTruthy()
                // end test:
                done()
            })
    })

    it('should create a task without children', (done) => {
        // create a due_date with one hour ahead:
        const due_date = ((new Date()).getTime() + (1 * 60 * 60 * 1000))

        // create payload variable
        const payload = {
            title: 'First Unit Testing: Task',
            description: 'This task was generated by jest library',
            due_date: new Date(due_date).toISOString(),
            requester: userName,
        }

        request(app)
            .post('/tasks')
            .send(payload)
            .set('Accept', 'application/json')
            .expect(201)
            .end((err, result) => {
                if (err) done(err)

                // set into global scope to use in delete test
                if (result.status == 201)
                    taskWithoutChildrenId = result.body.response

                expect(result.status).toBe(201)
                // end test:
                done()
            })
    })

    it('should create a task with children that does not exist', (done) => {
        // create a due_date with one hour ahead:
        const due_date = ((new Date()).getTime() + (1 * 60 * 60 * 1000))

        // create payload variable
        const payload = {
            title: 'Parent => Unit Testing: Task',
            description: 'This task was generated by jest library',
            owners: ['jest-1', 'jest-2', 'jest-3'],
            due_date: new Date(due_date).toISOString(),
            requester: userName,
            children: [
                { title: 'Unit Testing: Children Task' },
                { id: taskWithoutChildrenId }
            ]
        }

        request(app)
            .post('/tasks')
            .send(payload)
            .set('Accept', 'application/json')
            .expect(201)
            .end((err, result) => {
                if (err) done(err)

                // set into global scope to use in delete test
                if (result.status == 201)
                    taskWithChildrenId = result.body.response

                expect(result.status).toBe(201)
                // end test:
                done()
            })
    })

    it('should check if the created task has the chosen children', (done) => {
        request(app)
            .get(`/tasks/${taskWithChildrenId}`)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                const { response } = result.body

                const childrenToValidate = [
                    'Unit Testing: Children Task',
                    'First Unit Testing: Task'
                ]

                const childrenTestTitle = response.children
                    .every((child) => childrenToValidate.indexOf(child.title) >= 0)

                expect(response.children.length).toBe(2)
                expect(childrenTestTitle).toBeTruthy()

                // end test:
                done()
            })
    })

    it('should check if the created task has three owners', (done) => {
        request(app)
            .get(`/tasks/${taskWithChildrenId}`)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                const { response } = result.body

                expect(response.owners.length)
                    .toBe(3)
                // end test:
                done()
            })
    })
});

describe('test: list of tasks', () => {
    it('should return success status', (done) => {
        request(app)
            .get(`/tasks?limit=1`)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                // check if status is OK (200)
                expect(result.status).toBe(200)
                // end test:
                done()
            })
    })

    it('should return list of tasks with limit of 1', (done) => {
        request(app)
            .get(`/tasks?limit=1`)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                const { response } = result.body

                expect(response.length).toBe(1)
                // end test:
                done()
            })
    })
})

describe('test: task status change', () => {
    it('should change status of created task to doing', (done) => {
        request(app)
            .put(`/tasks/status/${taskWithoutChildrenId}`)
            .send({ status: 'doing' })
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                const { message } = result.body
                // change created task status
                expect(message).toEqual('task status has been changed')
                // end test:
                done()
            })
    })

    it('should check if status has been changed successfully', (done) => {
        request(app)
            .get(`/tasks/${taskWithoutChildrenId}`)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                const { response } = result.body
                // change created task status
                expect(response.status).toEqual('doing')
                // end test:
                done()
            })
    })

    it('should check if parent status has been changed to doing', (done) => {
        request(app)
            .get(`/tasks/${taskWithChildrenId}`)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                const { response } = result.body
                // change created task status
                expect(response.status).toEqual('doing')
                // end test:
                done()
            })
    })

    it('should fail when trying to update parent status', (done) => {
        request(app)
            .put(`/tasks/status/${taskWithChildrenId}`)
            .send({ status: 'doing' })
            .set('Accept', 'application/json')
            .expect(400)
            .end((err, result) => {
                if (err) done(err)
                const { message } = result.body
                // change created task status
                expect(message).toEqual('in order to change parent status, you need to complete your children')
                // end test:
                done()
            })
    })

    it('should change status of created task (without children) to done', (done) => {
        request(app)
            .put(`/tasks/status/${taskWithoutChildrenId}`)
            .send({ status: 'done' })
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                const { message } = result.body
                // change created task status
                expect(message).toEqual('task status has been changed')
                // end test:
                done()
            })
    })

    it('should change status of children to done', (done) => {
        taskService.taskDetails(taskWithChildrenId)
            .then((result) => {
                // search for the other children id
                const children = result.children
                    .find(({ id }) => id != taskWithoutChildrenId)

                request(app)
                    .put(`/tasks/status/${children.id}`)
                    .send({ status: 'done' })
                    .set('Accept', 'application/json')
                    .expect(200)
                    .end((err, result) => {
                        if (err) done(err)
                        const { message } = result.body
                        // change created task status
                        expect(message).toEqual('task status has been changed')
                        // end test:
                        done()
                    })
            })
    })

    it('should check if parent status was changed to done', (done) => {
        request(app)
            .get(`/tasks/${taskWithChildrenId}`)
            .set('Accept', 'application/json')
            .expect(200)
            .end((err, result) => {
                if (err) done(err)
                const { response } = result.body
                // change created task status
                expect(response.status).toEqual('done')
                // end test:
                done()
            })
    })

    it('should fail when trying to change status backwards', (done) => {
        request(app)
            .put(`/tasks/status/${taskWithoutChildrenId}`)
            .send({ status: 'to_do' })
            .set('Accept', 'application/json')
            .expect(400)
            .end((err, result) => {
                if (err) done(err)
                const { message } = result.body
                // change created task status
                expect(message)
                    .toEqual('task status is not able to change, because it is already done')
                // end test:
                done()
            })
    })
})

describe('test: delete created test tasks', () => {
    it('should delete parent and children tasks', async () => {
        const taskDetails = await taskService
            .taskDetails(taskWithChildrenId)

        for (const child of taskDetails.children) {
            const deletedTaskResult = await taskService
                .taskDelete(child.id)

            expect(deletedTaskResult).toBe(1);
        }

        const deletedParentTaskResult = await taskService
            .taskDelete(taskWithChildrenId)

        expect(deletedParentTaskResult).toBe(1);
    })

    it('should check if task was deleted', (done) => {
        request(app)
            .get(`/tasks/${taskWithChildrenId}`)
            .set('Accept', 'application/json')
            .expect(404)
            .end((err, result) => {
                if (err) done(err)
                // check not found status
                expect(result.status).toBe(404)
                // end test:
                done()
            })
    })
})