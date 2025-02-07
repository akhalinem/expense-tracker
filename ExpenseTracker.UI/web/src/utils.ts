import axios from "axios"

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true
})

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