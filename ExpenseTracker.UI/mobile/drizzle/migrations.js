import journal from './meta/_journal.json';
import m0000 from './0000_initial.sql';
import m0001 from './0001_introduce_transactions.sql';
import m0002 from './0002_migrate_budgets_into_transactions.sql';
import m0003 from './0003_migrate_expenses_into_transactions.sql';
import m0004 from './0004_drop_expenses_and_budgets_tables.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003,
    m0004
  }
}
