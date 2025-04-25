import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer>();

    async function main() {
        console.log("booting.....")
        const webcontainerInstance = await WebContainer.boot();
        setWebcontainer(webcontainerInstance)
        console.log("booted!!!")
    }
    useEffect(() => {
        main();
    }, [])

    return webcontainer;
}