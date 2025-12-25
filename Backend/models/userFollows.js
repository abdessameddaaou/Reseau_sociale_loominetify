const { DataTypes } = require("sequelize");
const db = require("../db/db");
const Users = require("./users");

const UserFollow = db.define("UserFollows", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  followerId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  followingId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
}, {
  indexes: [
    {
      unique: true,
      fields: ["followerId", "followingId"],
    },
  ],
});

Users.belongsToMany(Users, {
  through: UserFollow,
  as: "following",
  foreignKey: "followerId",
  otherKey: "followingId",
});

Users.belongsToMany(Users, {
  through: UserFollow,
  as: "followers",
  foreignKey: "followingId",
  otherKey: "followerId",
});

module.exports = UserFollow;