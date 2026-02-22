const { DataTypes } = require("sequelize");
const db = require("../db/db");

const UserBlock = db.define("UserBlocks", {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    blockerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    blockedId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, {
    timestamps: true,
    indexes: [{ unique: true, fields: ["blockerId", "blockedId"] }],
});

module.exports = UserBlock;
