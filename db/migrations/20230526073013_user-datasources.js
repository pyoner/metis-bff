const { USERS_TABLE, USER_DATASOURCES_TABLE, FOREIGN_KEY_LENGTH } = require('../../services/db');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable(USER_DATASOURCES_TABLE, (table) => {
        table.increments('id');
        table.integer('user_id', FOREIGN_KEY_LENGTH).unsigned().index();
        table.uuid('uuid').unique();
        table.timestamps(false, true, true);

        table
            .foreign('user_id', 'fk_user_id')
            .references('id')
            .inTable(USERS_TABLE)
            .onDelete('CASCADE');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable(USER_DATASOURCES_TABLE);
};
