import { Fragment } from "react";
import MonthlyExpenses from '~/components/MonthlyExpenses';
import { usePeriod } from '~/contexts/PeriodContext';

export default function HomeScreen() {
    const { selectedPeriod } = usePeriod();

    return (
        <Fragment>
            <MonthlyExpenses
                month={selectedPeriod.month}
                year={selectedPeriod.year}
            />
        </Fragment>
    );
}

