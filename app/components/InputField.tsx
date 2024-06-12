import React, { useEffect, useState } from "react"
import { chibii } from "chibii"

export default function InputField({
    placeholder,
    name,
    id,
    value,
    type,
    setValue,
    active,
    error
}: {
    placeholder: string
    name: string
    id: string | number
    value: string
    type: React.HTMLInputTypeAttribute
    setValue: (value: string) => any
    active: boolean
    error?: string
}) {
    //const [value, setValue] = useState("")

    const chibiis = chibii({
        placeholderClose: {
            targets: `.placeholder${id}`,
            top: ["-55%", 0],
            zIndex: [30, 10],
            direction: "forwards",
            easing: "easeInOutBack",
            duration: 300,
            autoplay: false
        },
        placeholderOpen: {
            targets: `.placeholder${id}`,
            top: [0, "-55%"],
            zIndex: [10, 30],
            direction: "forwards",
            easing: "easeInOutBack",
            duration: 300,
            autoplay: false
        }
    })

    useEffect(() => {
        if (value) {
            chibiis?.placeholderOpen.play()
            console.log(`${name} DOING OPEN ON STARTUP`)
        }
    }, [chibiis])

    return (
        <>
            <div
                className={`input-box${id} relative border-2 h-16 w-full bg-inherit my-4 ${
                    active ? "block" : "hidden"
                }`}
            >
                <label
                    htmlFor={name}
                    className={`absolute placeholder${id} text-xl z-10 m-4 px-1 rounded-md bg-inherit`}
                >
                    {placeholder}
                </label>
                <input
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    name={name}
                    type={type}
                    onFocus={e => {
                        if (!value) {
                            chibiis?.placeholderOpen.play()
                            console.log(`${name} DOING OPEN`)
                        }
                    }}
                    onBlur={e => {
                        if (!value) {
                            chibiis?.placeholderClose.play()
                            console.log(`${name} DOING CLOSE`)
                        }
                    }}
                    className={`input-field${id} w-full h-full text-xl z-20 absolute bg-transparent p-4 ring-0 outline-0`}
                />
            </div>
            {error ? (
                <div className="w-full mb-4 text-red-400 font-bold">
                    {error}
                </div>
            ) : (
                <></>
            )}
        </>
    )
}
