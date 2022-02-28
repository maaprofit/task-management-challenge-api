module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: DataTypes.STRING(50),
            created_at: DataTypes.DATE
        },
        {
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: false,
            underscored: true,
            freezeTableName: true,
            tableName: 'users'
        }
    )

    return User
}