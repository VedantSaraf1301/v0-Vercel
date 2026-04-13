"use client"

import {QueryClient,QueryClientProvider} from "@tanstack/react-query"
import { useState } from "react"

export function QueryProvider({children}){
    const [client] = useState(()=> new QueryClient()) //if i dont use useState then it will create a client on every render

    return(
        <QueryClientProvider client={client}>
            {children}
        </QueryClientProvider>
    )
}