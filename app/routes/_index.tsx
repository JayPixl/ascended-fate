import { User } from "@prisma/client"
import type {
    ActionFunction,
    LoaderFunction,
    MetaFunction
} from "@remix-run/node"
import { Link, useLoaderData } from "@remix-run/react"
import { useState } from "react"
import Navbar from "~/components/Navbar"
import { generateName } from "~/utils/name-generator"
import { prisma } from "~/utils/prisma.server"
import { getUser } from "~/utils/users.server"

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" }
    ]
}

export const action: ActionFunction = async ({ request }) => {
    await prisma.character.deleteMany()
    return null
}

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)

    return { user }
}

export default function Index() {
    const { user } = useLoaderData() as unknown as { user: User }
    const [randomName, setRandomName] = useState(generateName())
    return (
        <>
            <Navbar user={user} />
            <div className="w-full h-[90vh] flex justify-center items-center">
                <div className="flex flex-col items-center">
                    <Link
                        to={"/login?redirect=%2Fplay"}
                        className="w-full flex justify-center items-center px-12 py-5 border border-neutral-50 rounded-md text-2xl font-bold"
                    >
                        Log In
                    </Link>

                    <div className="my-8 font-semibold">- or -</div>

                    <Link
                        to={"/play"}
                        className="w-full flex justify-center items-center px-12 py-5 border border-neutral-50 rounded-md text-2xl font-bold"
                    >
                        Play as Guest
                    </Link>

                    <form method="POST">
                        <button name="clear">CLEAR</button>
                    </form>
                </div>
            </div>
        </>
    )
}
