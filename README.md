# Task Management Challenge - API

This API is using only *express* framework, for a demonstration purpose.

## Requirements

- NodeJS (stable version)
- PostgreSQL (stable version)

## Steps to execute the API

1. Create an `.env` file based on `.env.example` and set your PostgreSQL credentials
2. Install project dependencies with the node (npm) command:

```
npm install
```

3. Create the tables that we need to get the project running perfectly:

```sql
SET TIME ZONE 'UTC';

-- Create task status ENUM type
CREATE TYPE tasks_status AS ENUM ('to_do', 'doing', 'done');

CREATE TABLE users (
	id serial primary key,
	name varchar(50) not null,
	created_at timestamp with time zone default current_timestamp
);

CREATE TABLE tasks (
    id serial primary key,
	title varchar(80) not null,
	description text default null,
	status tasks_status not null,
	requester_id integer not null,
	due_date timestamp with time ZONE not null,
	created_at timestamp with time zone default CURRENT_TIMESTAMP,
	modified_at timestamp with time zone default CURRENT_TIMESTAMP,
	CONSTRAINT fk_requester_id FOREIGN KEY (requester_id) REFERENCES users (id)
);

CREATE TABLE tasks_owners (
	id serial primary key,
	task_id integer not null,
	user_id integer not null,
	CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users (id),
	CONSTRAINT fk_task_id FOREIGN KEY (task_id) REFERENCES tasks (id)
);

CREATE TABLE tasks_childrens (
	id serial primary key,
	parent_id integer not null,
	children_id integer not null,
	CONSTRAINT fk_task_parent_id FOREIGN KEY (parent_id) REFERENCES tasks (id),
	CONSTRAINT fk_task_children_id FOREIGN KEY (children_id) REFERENCES tasks (id)
);
```

**Important**: Execute in order, because there are constraints between them.

4. Start server on the chosen port by executing:

```
npm run start
```

## How to know more about the endpoints

To have a quick look on the endpoints, we recommend to use this [POSTMAN](https://www.postman.com/) link:
https://www.getpostman.com/collections/c562e5d3ba11ca177260

This is a basic REST API that contains a specific logic related to a code challenge. The API purpose is to create
tasks that has relations with children. And also, where a task can belong to one or more owners.

### Read this before using our API

- Use your local timezone date, we will always convert and return as UTC. So, you can manage the way you desire on the front-end.
- Remember to set your database timezone as UTC, to work well with our API :smile:.

### Routes

1. GET `/tasks`

Shows a list of the created tasks in database, without any hierarchical tree between parent and childrens.
There are some available parameters, to get a better view of what you can use inside front-end:

- limit `integer`: limit results *(default: 10)* - must be greater than 0
- requester `string`: filter by requester name
- order_by `string`: must be DESC or ASC *(default: DESC)*

All the parameters are optional to use.

------

2. POST `/tasks`

There are many ways of creating tasks, I'll give some payload examples:

> Task without any children

```json
{
    "title": "Task: Describing README",
    "description": "This is my task description",
    "requester": "marcelo",
    "due_date": "2022-03-20 13:00:00",
    "owners": ["andre"]
}
```

> Task with one children that doesn't exists

```json
{
    "title": "Task: Describing README",
    "description": "This is my task description",
    "requester": "marcelo",
    "due_date": "2022-03-20 13:00:00",
    "owners": ["andre"],
    "children": [
        {
            "title": "Subtask: Describe routes",
            "description": "This is my subtask description",
            "due_date": "2022-03-19 13:00:00"
        }
    ]
}
```

> Task with one children that doesn't exists and one that already exists

```json
{
    "title": "Task: Describing README",
    "description": "This is my task description",
    "requester": "marcelo",
    "due_date": "2022-03-20 13:00:00",
    "owners": ["andre"],
    "children": [
        {
            "title": "Subtask: Describe routes",
            "description": "This is my subtask description",
            "due_date": "2022-03-19 13:00:00"
        },
        {
            "id": 1
        }
    ]
}
```

There are some rules that need to be respected:

1. Children `due_date` can't be greater than parent `due_date`
2. Children can't be related to another parent, is allowed only one parent to many children *(1:N)*
3. An existent parent can't be related to another task, if it already has children

Hope you enjoy creating your TODO tasks.

------

3. GET `/tasks/:id`

This endpoint returns all the information of desired task, including all the relations: (parent / children).

------

4. PUT `/tasks/status/:id`

To move your task status, use this endpoint, I assure you that it is really easy!
Allowed values: `to_do / doing / done`.

You need to pass through body, one of the options above:

```json
{
    "status": "doing"
}
```

Here we have more rules to respect:

1. If the chosen task has children, you can't change parent status, you need to move all of the children
2. You can't go backwards if you already finished your task (status: done)
3. Parent task will be marked as done, when all children are marked as done :smile:

## Testing your application

We created a test suite using **Jest**. To use it after installing your dependencies, execute the command:

```
npm run test
```

