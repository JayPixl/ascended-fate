import { XCircleIcon } from "@heroicons/react/16/solid"
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
    useSearchParams
} from "@remix-run/react"
import { useState } from "react"
import InputField from "~/components/InputField"
import Navbar from "~/components/Navbar"
import { getUser, login, signup } from "~/utils/users.server"
import {
    validateEmail,
    validateExists,
    validateLength,
    validatePasswordsMatch,
    validateUsername
} from "~/utils/validators"

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" }
    ]
}

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)

    let { searchParams } = new URL(request.url)
    const redirectPath = searchParams.get("redirect") || "/"

    if (user) return redirect(redirectPath)
    return null
}

export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()

    let { searchParams } = new URL(request.url)
    const redirectPath = searchParams.get("redirect") || "/"

    const action = form.get("_action")!
    let fields = {
        email: (form.get("email") as string) || "",
        username: (form.get("username") as string) || "",
        emailOrUsername: (form.get("emailOrUsername") as string) || "",
        password: (form.get("password") as string) || "",
        confirmPassword: (form.get("confirmPassword") as string) || ""
    }

    switch (action) {
        case "login": {
            const fieldErrors = {
                emailOrUsername: validateExists(
                    fields.emailOrUsername,
                    "an email"
                ),
                password: validateExists(fields.password, "a password")
            }
            if (Object.values(fieldErrors).some(Boolean)) {
                return json({ fields, fieldErrors })
            } else {
                console.log(
                    `Logging in as ${fields.emailOrUsername} with password ${fields.password}.`
                )
                const { error, redirectTo } = await login({
                    emailOrUsername: fields.emailOrUsername,
                    password: fields.password,
                    redirectTo: redirectPath
                })
                if (error) {
                    return json({ fields, formError: error, action })
                } else {
                    return redirect(redirectTo?.path || "/", {
                        ...redirectTo?.body
                    })
                }
            }
        }
        case "signup": {
            const fieldErrors = {
                email: validateEmail(fields.email),
                username: validateUsername(fields.username),
                password: validateLength(fields.password, 6, 20),
                confirmPassword: validatePasswordsMatch(
                    fields.password,
                    fields.confirmPassword
                )
            }
            if (Object.values(fieldErrors).some(Boolean)) {
                return json({ fields, fieldErrors, action })
            } else {
                const { error, srvFieldErrors, redirectTo } = await signup({
                    email: fields.email,
                    username: fields.username,
                    password: fields.password,
                    redirectTo: redirectPath
                })
                if (
                    error ||
                    (srvFieldErrors &&
                        Object.values(srvFieldErrors).some(Boolean))
                ) {
                    return json({
                        fields,
                        fieldErrors: srvFieldErrors,
                        formError: error,
                        action
                    })
                } else {
                    return redirect(redirectTo?.path || "/", {
                        ...redirectTo?.body
                    })
                }
            }
        }
        default: {
            return json({ fields, formError: "Invalid request type" })
        }
    }
}

export default function Login() {
    const actionData = useActionData<typeof action>()

    const [frmAction, setFrmAction] = useState<"login" | "signup">(
        actionData?.action || "login"
    )

    const [inputs, setInputs] = useState({
        email: actionData?.fields?.email || "",
        username: actionData?.fields?.username || "",
        emailOrUsername: actionData?.fields?.emailOrUsername || "",
        password: actionData?.fields?.password || "",
        confirmPassword: actionData?.fields?.confirmPassword || ""
    })

    return (
        <>
            <Navbar />

            <div className="w-full h-[90vh] flex justify-center items-center">
                <form
                    method="POST"
                    className="flex flex-col items-center w-full max-w-[40rem] p-6 m-6 bg-neutral-700"
                >
                    <div className="flex flex-row items-stretch justify-center">
                        <div
                            className={`flex flex-row justify-center items-center py-3 px-6 md:px-6 md:py-4 border-b-4 text-xl md:text-2xl font-semibold hover:border-b-action-600   hover:text-action-600   transition-colors cursor-pointer
                            ${
                                frmAction === "login"
                                    ? "border-b-neutral-200 text-neutral-200"
                                    : "border-b-neutral-400 text-neutral-400"
                            }
                            `}
                            onClick={() => setFrmAction("login")}
                        >
                            Log In
                        </div>
                        <div
                            className={`flex flex-row justify-center items-center py-3 px-6 md:px-6 md:py-4 border-b-4 text-xl md:text-2xl font-semibold hover:border-b-action-600   hover:text-action-600   transition-colors cursor-pointer
                            ${
                                frmAction === "signup"
                                    ? "border-b-neutral-200 text-neutral-200"
                                    : "border-b-neutral-400 text-neutral-400"
                            }
                            `}
                            onClick={() => setFrmAction("signup")}
                        >
                            Sign Up
                        </div>
                    </div>

                    {actionData?.formError ? (
                        <div className="flex flex-row items-center py-3 px-5 font-bold text-lg w-full bg-red-400 rounded-lg my-5">
                            <XCircleIcon className="w-5 h-5 text-neutral-700" />
                            <span>&nbsp;{actionData.formError}</span>
                        </div>
                    ) : (
                        <div className="w-full h-5"></div>
                    )}

                    <InputField
                        id={"1"}
                        name="emailOrUsername"
                        placeholder="Email or Username"
                        value={inputs.emailOrUsername}
                        setValue={val =>
                            setInputs({
                                ...inputs,
                                emailOrUsername: val
                            })
                        }
                        type="text"
                        active={frmAction === "login"}
                        error={actionData?.fieldErrors?.emailOrUsername}
                    />

                    <InputField
                        id={"2"}
                        name="email"
                        placeholder="Email"
                        value={inputs.email}
                        setValue={val => setInputs({ ...inputs, email: val })}
                        type="email"
                        active={frmAction === "signup"}
                        error={actionData?.fieldErrors?.email}
                    />

                    <InputField
                        id={"3"}
                        name="username"
                        placeholder="Username"
                        value={inputs.username}
                        setValue={val =>
                            setInputs({ ...inputs, username: val })
                        }
                        type="text"
                        active={frmAction === "signup"}
                        error={actionData?.fieldErrors?.username}
                    />

                    <InputField
                        id={"4"}
                        name="password"
                        placeholder="Password"
                        value={inputs.password}
                        setValue={val =>
                            setInputs({ ...inputs, password: val })
                        }
                        type="password"
                        active={true}
                        error={actionData?.fieldErrors?.password}
                    />

                    <InputField
                        id={"5"}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={inputs.confirmPassword}
                        setValue={val =>
                            setInputs({ ...inputs, confirmPassword: val })
                        }
                        type="password"
                        active={frmAction === "signup"}
                        error={actionData?.fieldErrors?.confirmPassword}
                    />

                    <button name="_action" value={frmAction} type="submit">
                        {frmAction === "login" ? "LOG IN" : "SIGN UP"}
                    </button>
                </form>
            </div>
        </>
    )
}
