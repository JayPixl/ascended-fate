import { User } from "@prisma/client"
import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData } from "@remix-run/react"
import { useEffect } from "react"
import Navbar from "~/components/Navbar"
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

    if (!user) {
        const { redirectTo, error } = await createGuestUser()
        if (error || !redirectTo) return redirect("/")
        return redirect(redirectTo?.path, redirectTo?.body)
    }

    return { user }
}

export default function Play() {
    const { user } = useLoaderData() as unknown as { user: UserWithCharacters }

    return (
        <>
            <Navbar user={user} />
            <div className="w-full h-[90vh] flex justify-center items-center">
                <div className="flex flex-col items-center">
                    {user.characters.length > 0 ? (
                        user.characters.filter(char => char.status === "ACTIVE")
                            .length ? (
                            <Link to={"campaign"}>
                                Continue with{" "}
                                {
                                    user.characters.filter(
                                        char => char.status === "ACTIVE"
                                    )[0].name
                                }
                            </Link>
                        ) : (
                            <Link to={"campaign"}>Create New Character</Link>
                        )
                    ) : (
                        <Link to={"campaign"}>Create Your First Character</Link>
                    )}
                </div>
            </div>
        </>
    )
}
