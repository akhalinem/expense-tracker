import { useEffect } from "react";
import { Redirect, useRouter, } from "expo-router";

export default () => {
    const router = useRouter()

    useEffect(() => {
        setTimeout(() => {
            router.push({
                pathname: '/new-transaction',
                params: { presentation: 'modal' }
            })
        }, 1)
    }, [])

    return <Redirect href='./transactions' />;
};