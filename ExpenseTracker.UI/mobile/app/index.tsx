import { Fragment } from "react";
import MonthlyExpenses from '~/components/MonthlyExpenses';

export default function HomeScreen() {
    const currentDate = new Date();

    return (
        <Fragment>
            <MonthlyExpenses
                month={currentDate.getMonth() + 1}
                year={currentDate.getFullYear()}
            />
        </Fragment>
    );
}

