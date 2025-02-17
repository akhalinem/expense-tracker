export function displayCurrency(amount: number) {
    return amount.toLocaleString(process.env.EXPO_PUBLIC_LOCALE, {
        style: "currency",
        currency: process.env.EXPO_PUBLIC_CURRENCY
    })
}

export function displayDate(date: string) {
    return new Date(date).toLocaleString(
        process.env.EXPO_PUBLIC_LOCALE,
        {
            dateStyle: 'long',
        }
    )
}