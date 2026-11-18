"use client"

import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr"
import { X } from "lucide-react"
import { useRef, useState } from "react"

const Search = ({ placeholder, searchItem }) => {
    const searchRef = useRef()
    const [inputVal, setInputVal] = useState("")

    const handleSearch = () => {
        const val = searchRef.current.value
        setInputVal(val)
        searchItem(val)
    }

    const hapusVal = () => {
        setInputVal("")
        searchRef.current.value = ""
        searchItem("")
    }

    return(
        <div className="flex relative w-full">
            <MagnifyingGlass size={18} className="absolute bottom-[25%] left-3 cursor-pointer" />
            <input
                ref={searchRef}
                onChange={handleSearch}
                type="text"
                placeholder={`Search ${placeholder}`}
                className="w-full pl-12 py-1 box-border focus:border outline-none rounded-sm"
            />
            <X
                size={15}
                className={`absolute bottom-[25%] right-3 cursor-pointer ${inputVal !== "" ? 'visible' : 'invisible'}`}
                onClick={hapusVal}
            />
        </div>
    )
}

export default Search
