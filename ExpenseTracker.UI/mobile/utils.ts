export function displayCurrency(amount: number) {
    return amount.toLocaleString("uz-UZ", {
        style: "currency",
        currency: "UZS"
    })
}

export function displayDate(date: string) {
    return new Date(date).toLocaleString(
        "uz-UZ",
        {
            dateStyle: 'long',
        }
    )
}