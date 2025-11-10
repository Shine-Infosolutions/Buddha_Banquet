import { useState, useEffect } from 'react'
import { FaTrash, FaEdit } from 'react-icons/fa'



const MenuItemManager = () => {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [customerRef, setCustomerRef] = useState('')
  const [message, setMessage] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', category: '', price: '' })
  const [newItemForm, setNewItemForm] = useState({ name: '', category: '', foodType: '' })
  const [foodTypeFilter, setFoodTypeFilter] = useState('All')
  const [categories, setCategories] = useState([])

  // Load menu items and categories on component mount
  useEffect(() => {
    fetchMenuItems()
    fetchCategories()
  }, [])

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Unknown'
    
    // If categoryId is already a category object, return its cateName
    if (typeof categoryId === 'object' && categoryId.cateName) {
      return categoryId.cateName
    }
    
    // Otherwise, find the category by ID
    const category = categories.find(cat => 
      cat._id === categoryId || 
      cat._id.toString() === categoryId.toString()
    )
    return category ? category.cateName : 'Unknown'
  }

  const [categoryNames, setCategoryNames] = useState({})

  const getCategoryNameAsync = async (categoryId) => {
    if (!categoryId) return 'Unknown'
    if (categoryNames[categoryId]) return categoryNames[categoryId]
    
    const name = await fetchCategoryById(categoryId)
    setCategoryNames(prev => ({ ...prev, [categoryId]: name }))
    return name
  }

  const fetchCategoryById = async (categoryId) => {
    try {
      const response = await fetch(`https://regalia-backend.vercel.app/api/categories/get/${categoryId}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Category by ID Response:', data)
        return data.cateName || 'Unknown'
      } else {
        console.error('Category by ID API error:', response.status)
        return 'Unknown'
      }
    } catch (error) {
      console.error('Category by ID fetch error:', error)
      return 'Unknown'
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://regalia-backend.vercel.app/api/categories/all')
      if (response.ok) {
        const data = await response.json()
        console.log('Categories API Response:', data)
        // Handle different response formats
        let categoriesData = []
        if (Array.isArray(data)) {
          categoriesData = data
        } else if (data.data && Array.isArray(data.data)) {
          categoriesData = data.data
        } else if (data.categories && Array.isArray(data.categories)) {
          categoriesData = data.categories
        }
        setCategories(categoriesData)
      } else {
        console.error('Categories API error:', response.status)
        setCategories([])
      }
    } catch (error) {
      console.error('Categories fetch error:', error)
      setCategories([])
    }
  }

  const fetchMenuItemsByFoodType = async (foodType, categoryId = null) => {
    setLoading(true)
    try {
      let url = 'https://regalia-backend.vercel.app/api/menu-items/'
      const params = new URLSearchParams()
      
      if (foodType !== 'All') {
        params.append('foodType', foodType)
      }
      
      if (categoryId) {
        params.append('category', categoryId)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      console.log('Fetching menu items from URL:', url)
      const response = await fetch(url)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Filter API Response:', data)
        
        // Handle different response formats
        let items = []
        if (Array.isArray(data)) {
          items = data
        } else if (data.data && Array.isArray(data.data)) {
          items = data.data
        } else if (data.menuItems && Array.isArray(data.menuItems)) {
          items = data.menuItems
        }
        
        console.log('Filtered items:', items)
        setMenuItems(items)
        setMessage(`Loaded ${items.length || 0} ${foodType === 'All' ? '' : foodType} menu items`)
      } else {
        console.error('API Error:', response.status)
        setMessage(`Server error: ${response.status}`)
        setMenuItems([])
      }
    } catch (error) {
      console.error('Filter Error:', error)
      setMessage(`API unavailable: ${error.message}`)
      setMenuItems([])
    }
    setLoading(false)
  }

  const fetchMenuItems = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://regalia-backend.vercel.app/api/menu-items/')
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data) // Debug log
        
        // Handle different response formats
        let items = []
        if (Array.isArray(data)) {
          items = data
        } else if (data.data && Array.isArray(data.data)) {
          items = data.data
        } else if (data.menuItems && Array.isArray(data.menuItems)) {
          items = data.menuItems
        }
        
        setMenuItems(items)
        setMessage(`Loaded ${items.length} menu items from server`)
      } else {
        setMessage(`Server error: ${response.status}`)
        setMenuItems([])
      }
    } catch (error) {
      setMessage(`API unavailable: ${error.message}`)
      setMenuItems([])
    }
    setLoading(false)
  }

  // API Functions
  const getMenuByBookingId = async (id) => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`https://regalia-backend.vercel.app/api/menus/${id}`)
      if (response.ok) {
        const data = await response.json()
        setMenuItems(Array.isArray(data) ? data : [])
        setMessage(`Found ${data.length || 0} menu items for booking ${id}`)
      } else {
        setMessage(`Server returned ${response.status}`)
        setMenuItems([])
      }
    } catch (error) {
      setMessage(`Connection failed: ${error.message}`)
      setMenuItems([])
    }
    setLoading(false)
  }

  const getMenuByCustomerRef = async (ref) => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`https://regalia-backend.vercel.app/api/menus/all/${ref}`)
      if (response.ok) {
        const data = await response.json()
        setMenuItems(Array.isArray(data) ? data : [])
        setMessage(`Found menu for customer ${ref}`)
      } else {
        setMessage(`Server returned ${response.status}`)
        setMenuItems([])
      }
    } catch (error) {
      setMessage(`Connection failed: ${error.message}`)
      setMenuItems([])
    }
    setLoading(false)
  }

  const updateMenuByCustomerRef = async (ref, categorizedMenu) => {
    setLoading(true)
    setMessage('')
    try {
      const response = await fetch(`https://regalia-backend.vercel.app/api/menus/update/${ref}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categorizedMenu })
      })
      if (response.ok) {
        setMessage('Menu updated successfully!')
      } else {
        setMessage(`Update failed: Server returned ${response.status}`)
      }
    } catch (error) {
      setMessage(`Update failed: Connection error`)
    }
    setLoading(false)
  }

  const handleEdit = (id) => {
    const item = menuItems.find(item => (item._id || item.id) === id)
    setEditingItem(id)
    // Extract category ID if it's an object
    const categoryId = typeof item.category === 'object' ? item.category._id : item.category
    setEditForm({ name: item.name, category: categoryId, foodType: item.foodType })
  }

  const saveEdit = async () => {
    try {
      const response = await fetch(`https://regalia-backend.vercel.app/api/menu-items/${editingItem}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      
      if (response.ok) {
        setMenuItems(menuItems.map(item => 
          (item._id || item.id) === editingItem ? { ...item, ...editForm } : item
        ))
        setEditingItem(null)
        setMessage('Item updated successfully!')
      } else {
        setMessage('Failed to update item')
      }
    } catch (error) {
      setMenuItems(menuItems.map(item => 
        (item._id || item.id) === editingItem ? { ...item, ...editForm } : item
      ))
      setEditingItem(null)
      setMessage(`API unavailable. Item updated locally: ${error.message}`)
    }
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditForm({ name: '', category: '', price: '' })
  }

  const addMenuItem = async () => {
    if (!newItemForm.name || !newItemForm.category || !newItemForm.foodType) {
      setMessage('Please fill all fields')
      return
    }
    
    // Prepare data in the format expected by backend
    const menuItemData = {
      name: newItemForm.name,
      category: newItemForm.category,
      foodType: newItemForm.foodType
    }
    
    try {
      const response = await fetch('https://regalia-backend.vercel.app/api/menu-items/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuItemData)
      })
      
      if (response.ok) {
        const newItem = await response.json()
        setMenuItems([...menuItems, newItem])
        setNewItemForm({ name: '', category: '', foodType: '' })
        setMessage('Menu item added successfully!')
      } else {
        const errorData = await response.text()
        setMessage(`Failed to add menu item: ${response.status} - ${errorData}`)
      }
    } catch (error) {
      const newItem = {
        id: Date.now(),
        name: newItemForm.name,
        category: newItemForm.category,
        foodType: newItemForm.foodType
      }
      setMenuItems([...menuItems, newItem])
      setNewItemForm({ name: '', category: '', foodType: '' })
      setMessage(`API unavailable. Item added locally: ${error.message}`)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`https://regalia-backend.vercel.app/api/menu-items/${id}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          setMenuItems(menuItems.filter(item => (item._id || item.id) !== id))
          setMessage('Item deleted successfully!')
        } else {
          setMessage('Failed to delete item')
        }
      } catch (error) {
        setMenuItems(menuItems.filter(item => (item._id || item.id) !== id))
        setMessage(`API unavailable. Item deleted locally: ${error.message}`)
      }
    }
  }



  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 xs:p-4 sm:p-6">
      <h2 className="text-lg xs:text-xl sm:text-2xl font-bold mb-4 xs:mb-6" style={{color: 'hsl(45, 100%, 20%)'}}>Menu Item Manager</h2>
      
      {/* Add New Menu Item Section */}
      <div className="bg-white rounded-lg border p-3 xs:p-4 sm:p-6 mb-4 xs:mb-6">
        <h3 className="text-base xs:text-lg font-semibold mb-3 xs:mb-4" style={{color: 'hsl(45, 100%, 20%)'}}>Add New Menu Item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
          <input
            type="text"
            placeholder="Item Name"
            value={newItemForm.name}
            onChange={(e) => setNewItemForm({...newItemForm, name: e.target.value})}
            className="px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm xs:text-base"
          />
          <select 
            value={newItemForm.category}
            onChange={(e) => setNewItemForm({...newItemForm, category: e.target.value})}
            className="px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm xs:text-base"
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.cateName}</option>
            ))}
          </select>
          <select 
            value={newItemForm.foodType}
            onChange={(e) => setNewItemForm({...newItemForm, foodType: e.target.value})}
            className="px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm xs:text-base"
          >
            <option key="select" value="">Select Food Type</option>
            <option key="both" value="Both">Both</option>
            <option key="veg" value="Veg">Veg</option>
            <option key="non-veg" value="Non-Veg">Non-Veg</option>
          </select>
          <button 
            onClick={addMenuItem}
            className="px-4 xs:px-6 py-2.5 xs:py-3 text-white rounded-lg font-medium touch-manipulation text-sm xs:text-base sm:col-span-2 lg:col-span-1"
            style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
          >
            + Add Item
          </button>
        </div>
      </div>
      
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          message.includes('Error') || message.includes('failed') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}
      
      {/* Menu Items Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-3 xs:p-4 border-b flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-0">
          <h3 className="text-base xs:text-lg font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Menu Items ({menuItems.length})</h3>
          <select 
            value={foodTypeFilter}
            onChange={(e) => {
              setFoodTypeFilter(e.target.value)
              fetchMenuItemsByFoodType(e.target.value)
            }}
            className="px-2 xs:px-3 py-1.5 xs:py-2 border border-gray-300 rounded-lg text-xs xs:text-sm w-full xs:w-auto"
          >
            <option key="all" value="All">All Items</option>
            <option key="veg" value="Veg">Veg Only</option>
            <option key="non-veg" value="Non-Veg">Non-Veg Only</option>
            <option key="both" value="Both">Both</option>
          </select>
        </div>
        
        {loading ? (
          <p className="p-4 xs:p-6 text-gray-600 text-sm xs:text-base">Loading...</p>
        ) : menuItems.length === 0 ? (
          <p className="p-4 xs:p-6 text-gray-600 text-sm xs:text-base">No menu items found. Use the buttons above to fetch menu data.</p>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3 p-3">
              {menuItems.map((item) => (
                <div key={item._id || item.id} className="bg-gray-50 border rounded-lg p-3">
                  {editingItem === (item._id || item.id) ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                        placeholder="Item Name"
                      />
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat._id}>{cat.cateName}</option>
                        ))}
                      </select>
                      <select
                        value={editForm.foodType}
                        onChange={(e) => setEditForm({...editForm, foodType: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="Both">Both</option>
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                      </select>
                      <div className="flex gap-2">
                        <button 
                          onClick={saveEdit}
                          className="flex-1 bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium"
                        >
                          Save
                        </button>
                        <button 
                          onClick={cancelEdit}
                          className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleEdit(item._id || item.id)}
                            className="text-blue-500 hover:text-blue-700 p-1"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button 
                            onClick={() => handleEdit(item._id || item.id)}
                            className="text-blue-500 hover:text-blue-700 p-2 mr-2"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            onClick={() => handleDelete(item._id || item.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div><span className="font-medium">Category:</span> {(() => {
                          if (typeof item.category === 'string' && item.category.includes('cateName')) {
                            const match = item.category.match(/cateName: '([^']+)'/);
                            return match ? match[1] : 'Unknown';
                          }
                          return item.category?.cateName || 'Unknown';
                        })()}</div>
                        <div><span className="font-medium">Food Type:</span> {item.foodType || 'Both'}</div>
                        <div><span className="font-medium">Status:</span> <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Name</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Category</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Food Type</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Status</th>
                    <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs lg:text-sm font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item._id || item.id} className="hover:bg-gray-50">
                      {editingItem === (item._id || item.id) ? (
                        <>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="w-full px-2 lg:px-3 py-1 lg:py-2 border rounded-lg text-xs lg:text-sm"
                            />
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                              className="w-full px-2 lg:px-3 py-1 lg:py-2 border rounded-lg text-xs lg:text-sm"
                            >
                              <option value="">Select Category</option>
                              {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.cateName}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <select
                              value={editForm.foodType}
                              onChange={(e) => setEditForm({...editForm, foodType: e.target.value})}
                              className="w-full px-2 lg:px-3 py-1 lg:py-2 border rounded-lg text-xs lg:text-sm"
                            >
                              <option value="Both">Both</option>
                              <option value="Veg">Veg</option>
                              <option value="Non-Veg">Non-Veg</option>
                            </select>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <span className="px-2 lg:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <button 
                              onClick={saveEdit}
                              className="text-green-600 hover:text-green-800 mr-2 lg:mr-3 text-xs lg:text-sm font-medium"
                            >
                              Save
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-800 text-xs lg:text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-blue-600 font-medium">
                            {(() => {
                              if (typeof item.category === 'string' && item.category.includes('cateName')) {
                                const match = item.category.match(/cateName: '([^']+)'/);
                                return match ? match[1] : 'Unknown';
                              }
                              return item.category?.cateName || 'Unknown';
                            })()}
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-gray-900">{item.foodType || 'Both'}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <span className="px-2 lg:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <button 
                              onClick={() => handleEdit(item._id || item.id)}
                              className="text-blue-500 hover:text-blue-700 p-1 lg:p-2 mr-1 lg:mr-2"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item._id || item.id)}
                              className="text-red-500 hover:text-red-700 p-1 lg:p-2"
                            >
                              <FaTrash size={14} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MenuItemManager