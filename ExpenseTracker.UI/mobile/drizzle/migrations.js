// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import initial from './0000_initial.sql';
import addIncomesTable from './0001_add_incomes_table.sql';

export default {
  journal,
  migrations: {
    initial,
    addIncomesTable
  }
}
