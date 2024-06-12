import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration
} from "@remix-run/react"

import tailwindStyles from "./tailwind.css?url"
import { LinksFunction } from "@remix-run/node"

export const links: LinksFunction = () => [
    {
        rel: "stylesheet",
        href: tailwindStyles
    }
]

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <Meta />
                <Links />
            </head>
            <body className="w-full max-w-full overflow-x-hidden min-h-[100vh] bg-neutral-800 text-neutral-50">
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    )
}

export default function App() {
    return <Outlet />
}
