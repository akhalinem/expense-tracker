import { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';

export default () => {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push('/new-transaction');
    }, 1);
  }, []);

  return <Redirect href="./transactions" />;
};
