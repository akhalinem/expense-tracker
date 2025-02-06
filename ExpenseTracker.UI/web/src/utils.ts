import axios from "axios"

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true
})

export const displayCurrency = (amount: number) => {
    return amount.toLocaleString("uz-UZ", {
        style: "currency",
        currency: "UZS"
    })
}