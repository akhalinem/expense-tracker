import axios from "axios"

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
})

export function displayCurrency(amount: number) {
    return amount.toLocaleString(process.env.NEXT_PUBLIC_LOCALE, {
        style: "currency",
        currency: process.env.NEXT_PUBLIC_CURRENCY,
    })
}

export function displayDate(date: string) {
    return new Date(date).toLocaleString(
        process.env.NEXT_PUBLIC_LOCALE,
        {
            dateStyle: 'long',
        }
    )
}