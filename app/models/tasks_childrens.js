module.exports = (sequelize, DataTypes) => {
    const TasksChildren = sequelize.define(
        'TasksChildren',
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
            tableName: 'tasks_childrens'
        }
    )

    TasksChildren.associate = (models) => {
        TasksChildren.belongsTo(models.Task, {
            foreignKey: 'parent_id',
            name: 'parent'
        })

        TasksChildren.belongsTo(models.Task, {
            foreignKey: 'children_id',
            name: 'children'
        })
    }

    return TasksChildren
}