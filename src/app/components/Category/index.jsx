const Category = ({activeCategory, setActiveCategory}) => {
    const menuCategory = [
        'All', 'Food', 'Drink', 'Dessert', 'Snack'
    ]

  return (
    <div className="fixed  top-14 bg-background h-10 flex justify-between px-10 text-sm items-center">
        {
            menuCategory.map(menu => (
                <button key={menu} onClick={() => setActiveCategory(menu)} className={`h-full w-full transition-all duration-300 box-border cursor-pointer ${activeCategory === menu ? 'text-highlight border-b-2 border-highlight' : ''}`}>{menu}</button>
            ))
        }
    </div>
  )
}

export default Category