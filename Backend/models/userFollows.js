const { DataTypes } = require("sequelize");
const db = require("../db/db");

const UserFollow = db.define("UserFollows", {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  followerId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  followingId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, {
  indexes: [{ unique: true, fields: ["followerId", "followingId"] }],
});

module.exports = UserFollow;