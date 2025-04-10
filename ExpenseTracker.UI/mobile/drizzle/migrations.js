// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_whole_sharon_carter.sql';
import addIncomesTable from './0001_add_incomes_table.sql';

export default {
  journal,
  migrations: {
    m0000,
    addIncomesTable
  }
}
