"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("example_tasks", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      completed: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("now") },
      deleted_at: { type: Sequelize.DATE },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("example_tasks");
  },
};