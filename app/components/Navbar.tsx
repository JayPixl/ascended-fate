import { User } from "@prisma/client"
import { Link } from "@remix-run/react"

export default function Navbar({ user }: { user?: User }) {
    return (
        <div className="w-full h-[10vh] flex justify-between items-center px-6">
            <div className="text-xl font-bold">
                <Link to={"/"}>Ascendant Fate</Link>
            </div>
            {user ? (
                <div className="">{user.username}</div>
            ) : (
                <div className="">
                    <Link to={"/login"}>Log In</Link>
                </div>
            )}
        </div>
    )
}
