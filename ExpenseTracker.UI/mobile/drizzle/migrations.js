import journal from './meta/_journal.json';
import m0000 from './0000_initial.sql';
import m0001 from './0001_introduce_transactions.sql';
import m0002 from './0002_migrate_budgets_into_transactions.sql';

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002
  }
}
