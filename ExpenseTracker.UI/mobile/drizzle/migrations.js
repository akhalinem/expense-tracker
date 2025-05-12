import journal from './meta/_journal.json';
import m0000 from './0000_initial.sql';
import m0001 from './0001_introduce_transactions.sql';
import m0002 from './0002_migrate_budgets_into_transactions.sql';
import m0003 from './0003_migrate_expenses_into_transactions.sql';
import m0004 from './0004_drop_expenses_and_budgets_tables.sql';
import m0005 from './0005_add_category_color.sql';
import m0006 from './0006_implement_multiple_categories_for_transactions-2.sql';

export default {
    journal,
    migrations: {
      m0000,
      m0001,
      m0002,
      m0003,
      m0004,
      m0005,
      m0006
    }
  }
  