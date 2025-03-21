export function displayCurrency(amount: number) {
    return amount.toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            style: "currency",
            currency: process.env.EXPO_PUBLIC_CURRENCY
        })
}

export function displayMonth(month: number, year?: number) {
    const currentYear = new Date().getFullYear();

    year ??= currentYear;

    if (year === currentYear) {
        return new Date(year, month - 1).toLocaleString(
            process.env.EXPO_PUBLIC_LOCALE,
            {
                month: 'long'
            });
    }

    return new Date(year, month - 1).toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            month: 'long',
            year: 'numeric'
        });
}

export function displayDate(date: string) {
    return new Date(date).toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            dateStyle: 'long',
        }
    )
}
