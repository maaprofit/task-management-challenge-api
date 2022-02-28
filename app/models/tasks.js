module.exports = (sequelize, DataTypes) => {
    const Task = sequelize.define(
        'Task',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            title: DataTypes.STRING(80),
            description: DataTypes.TEXT,
            status: {
                type: DataTypes.ENUM('to_do', 'doing', 'done')
            },
            due_date: DataTypes.DATE,
            created_at: DataTypes.DATE,
            modified_at: DataTypes.DATE
        },
        {
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'modified_at',
            underscored: true,
            freezeTableName: true,
            tableName: 'tasks'
        }
    )

    Task.associate = (models) => {
        Task.belongsTo(models.User, {
            foreignKey: 'requester_id'
        })
    }

    return Task
}