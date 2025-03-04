import { usePeriod } from '~/contexts/PeriodContext';
import MonthlyExpenses from '~/components/MonthlyExpenses';

export default function HomeScreen() {
    const { selectedPeriod } = usePeriod();

    return (
        <MonthlyExpenses
            month={selectedPeriod.month}
            year={selectedPeriod.year}
        />
    );
}

