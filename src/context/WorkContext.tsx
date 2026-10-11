
"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";

export type WorkRecord = {
    id: string;
    student: boolean;
    warehouse: string;
    norm: number;
    normPercent: number;
    rateTier: 100 | 115 | 125;
    ratePerPackage: number;
    earnings: number;
};

interface WorkContextType {
    records: WorkRecord[];
    addRecord: (record: Omit<WorkRecord, "id">) => void;
    deleteRecord: (id: string) => void;
}

const WorkContext = createContext<WorkContextType | null>(null);

const STORAGE_KEY = "warehouse-work-records";

export function useWorkContext() {
    const context = useContext(WorkContext);

    if (!context) {
        throw new Error(
            "useWorkContext must be used within WorkProvider"
        );
    }

    return context;
}

export function WorkProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [records, setRecords] = useState<WorkRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Завантажуємо записи після монтування компонента
    useEffect(() => {
        let loadedRecords: WorkRecord[] = [];

        try {
            const stored = localStorage.getItem(STORAGE_KEY);

            if (stored) {
                const parsed: unknown = JSON.parse(stored);

                if (Array.isArray(parsed)) {
                    loadedRecords = parsed;
                }
            }
        } catch (error) {
            console.error(
                "Помилка завантаження записів:",
                error
            );
        }

        // Оновлюємо стан через чергу мікрозадач,
        // щоб не викликати setState синхронно в тілі ефекту.
        queueMicrotask(() => {
            setRecords(loadedRecords);
            setIsLoaded(true);
        });
    }, []);

    // Зберігаємо записи лише після завершення завантаження
    useEffect(() => {
        if (!isLoaded) return;

        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(records)
            );
        } catch (error) {
            console.error(
                "Помилка збереження записів:",
                error
            );
        }
    }, [records, isLoaded]);

    // Додаємо новий запис
    function addRecord(record: Omit<WorkRecord, "id">) {
        const newRecord: WorkRecord = {
            ...record,
            id: crypto.randomUUID(),
        };

        setRecords((prev) => [...prev, newRecord]);
    }

    // Видаляємо запис
    function deleteRecord(id: string) {
        setRecords((prev) =>
            prev.filter((record) => record.id !== id)
        );
    }

    return (
        <WorkContext.Provider
            value={{
                records,
                addRecord,
                deleteRecord,
            }}
        >
            {children}
        </WorkContext.Provider>
    );
}
