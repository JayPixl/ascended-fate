import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { useState } from "react"
import { generateName } from "~/utils/name-generator"

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" }
    ]
}

export default function NameGen() {
    const [randomName, setRandomName] = useState(generateName())
    return (
        <>
            <div className="w-full h-[100vh] flex justify-center items-center">
                <div className="flex flex-col items-center">
                    <button
                        onClick={() => setRandomName(generateName())}
                        className="font-bold text-2xl"
                    >
                        {randomName}
                    </button>
                </div>
            </div>
        </>
    )
}
