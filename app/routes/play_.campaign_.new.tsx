import { User } from "@prisma/client"
import type {
    ActionFunction,
    LoaderFunction,
    MetaFunction
} from "@remix-run/node"
import {
    Link,
    json,
    redirect,
    useActionData,
    useLoaderData
} from "@remix-run/react"
import { useEffect, useState } from "react"
import Navbar from "~/components/Navbar"
import { createCharacter } from "~/utils/characters.server"
import { CLASSES } from "~/utils/engine/lib/classes"
import { RACES } from "~/utils/engine/lib/races"
import { ClassName, RaceName } from "~/utils/engine/skill-tree"
import { UserWithCharacters } from "~/utils/types"
import { createGuestUser, getUser } from "~/utils/users.server"

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" }
    ]
}

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)

    if (!user) return redirect("/play")

    if (
        (user as UserWithCharacters).characters.filter(
            char => char.status === "ACTIVE"
        ).length
    )
        return redirect("/play/campaign")

    return { user }
}

export const action: ActionFunction = async ({ request }) => {
    const { user } = await getUser(request)

    if (!user) return redirect("/play")

    if (
        (user as UserWithCharacters).characters.filter(
            char => char.status === "ACTIVE"
        ).length
    )
        return redirect("/play/campaign")

    const form = await request.formData()

    const race = (form.get("race") as string) || ""
    const _class = (form.get("class") as string) || ""

    if (
        !Object.keys(RACES).includes(race) ||
        !Object.keys(CLASSES).includes(_class)
    ) {
        return json({ error: "Invalid input values.", race, class: _class })
    }

    const { character } = await createCharacter(
        user,
        race as RaceName,
        _class as ClassName
    )
    console.log(JSON.stringify(character))
    return redirect("/play/campaign")
}

export default function NewCampaign() {
    const { user } = useLoaderData() as unknown as { user: UserWithCharacters }
    const actionData = useActionData<typeof action>()

    const [inputs, setInputs] = useState({
        race: actionData?.race || "",
        class: actionData?.class || ""
    })

    return (
        <>
            <Navbar user={user} />
            <div className="w-full h-[90vh] flex justify-center items-center">
                <form
                    className="flex flex-col items-center text-zinc-800"
                    method="POST"
                >
                    <div className="text-red-400">{actionData?.error}</div>
                    <select
                        name="race"
                        value={inputs.race}
                        onChange={e =>
                            setInputs({
                                ...inputs,
                                race: e.target.value,
                                class: ""
                            })
                        }
                    >
                        <option value="">Select Race</option>
                        {Object.entries(RACES).map(race => (
                            <option value={race[0]}>{race[1].name}</option>
                        ))}
                    </select>
                    <select
                        name="class"
                        value={inputs.class}
                        onChange={e =>
                            setInputs({ ...inputs, class: e.target.value })
                        }
                        disabled={inputs.race === ""}
                    >
                        <option value="">Select Class</option>
                        {Object.keys(RACES).includes(inputs.race) &&
                            RACES?.[
                                inputs.race as keyof typeof RACES
                            ]?.classes.map(myClass => (
                                <option value={myClass}>
                                    {CLASSES[myClass].name}
                                </option>
                            ))}
                    </select>
                    <button
                        disabled={inputs.class === ""}
                        className="text-neutral-100"
                    >
                        Create
                    </button>
                </form>
            </div>
        </>
    )
}
