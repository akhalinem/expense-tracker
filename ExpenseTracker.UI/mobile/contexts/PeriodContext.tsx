import { createContext, useContext, useState } from 'react';

type Period = {
    month: number;
    year: number;
};

type PeriodContextType = {
    selectedPeriod: Period;
    setSelectedPeriod: (period: Period) => void;
};

export const PeriodContext = createContext<PeriodContextType>({
    selectedPeriod: {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    },
    setSelectedPeriod: () => { },
});

export function PeriodProvider({ children }: { children: React.ReactNode }) {
    const [selectedPeriod, setSelectedPeriod] = useState<Period>(() => {
        const currentDate = new Date();

        return {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
        };
    });

    return (
        <PeriodContext.Provider value={{ selectedPeriod, setSelectedPeriod }}>
            {children}
        </PeriodContext.Provider>
    );
}

export function usePeriod() {
    const context = useContext(PeriodContext);
    if (!context) {
        throw new Error('usePeriod must be used within a PeriodProvider');
    }
    return context;
}
