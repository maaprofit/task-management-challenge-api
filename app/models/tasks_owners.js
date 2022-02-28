module.exports = (sequelize, DataTypes) => {
    const TasksOwner = sequelize.define(
        'TasksOwner',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            }
        },
        {
            timestamps: false,
            underscored: true,
            freezeTableName: true,
            tableName: 'tasks_owners'
        }
    )

    TasksOwner.associate = (models) => {
        TasksOwner.belongsTo(models.User, {
            foreignKey: 'user_id'
        })

        TasksOwner.belongsTo(models.Task, {
            foreignKey: 'task_id'
        })
    }

    return TasksOwner
}