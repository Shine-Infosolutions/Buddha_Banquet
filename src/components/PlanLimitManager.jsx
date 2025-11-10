import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';

const PlanLimitManager = () => {
  const [limits, setLimits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const [limitsResponse, categoriesResponse] = await Promise.all([
        fetch('https://regalia-backend.vercel.app/api/plan-limits/get'),
        fetch('https://regalia-backend.vercel.app/api/categories/all')
      ]);
      
      if (limitsResponse.ok) {
        const limitsData = await limitsResponse.json();
        setLimits(limitsData.success ? limitsData.data : []);
      }
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const handleSave = async (planData) => {
    try {
      const isEditing = planData._id;
      const url = isEditing 
        ? `https://regalia-backend.vercel.app/api/plan-limits/${planData._id}`
        : 'https://regalia-backend.vercel.app/api/plan-limits';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
      
      if (response.ok) {
        alert(`Plan limits ${isEditing ? 'updated' : 'saved'} successfully`);
        setEditingPlan(null);
        fetchLimits();
      } else {
        const errorData = await response.json();
        alert(errorData.message || `Failed to ${isEditing ? 'update' : 'save'} plan limits`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(`Failed to ${planData._id ? 'update' : 'save'} plan limits`);
    }
  };

  const handleDelete = async (planToDelete) => {
    try {
      const response = await fetch(`https://regalia-backend.vercel.app/api/plan-limits/${planToDelete._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Plan deleted successfully');
        fetchLimits();
      }
    } catch (error) {
      alert('Failed to delete plan');
    }
  };

  const PlanEditor = ({ plan, onSave, onCancel, onDelete }) => {
    const [categories, setCategories] = useState([]);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [formData, setFormData] = useState(() => {
      if (plan && Object.keys(plan).length > 0) {
        console.log('Editing plan:', plan);
        return {
          ...plan,
          limits: plan.limits || {}
        };
      }
      return {
        ratePlan: 'Silver',
        foodType: 'Veg',
        limits: {}
      };
    });

    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch('https://regalia-backend.vercel.app/api/categories/all');
          if (response.ok) {
            const data = await response.json();
            setCategories(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      };
      fetchCategories();
    }, []);

    const handleLimitChange = (categoryId, value) => {
      setFormData(prev => ({
        ...prev,
        limits: { ...prev.limits, [categoryId]: parseInt(value) || 0 }
      }));
    };

    const handleCreateCategory = async (categoryData) => {
      try {
        const response = await fetch('https://regalia-backend.vercel.app/api/categories/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
          alert('Category created successfully');
          setShowCategoryForm(false);
          const categoriesResponse = await fetch('https://regalia-backend.vercel.app/api/categories/all');
          if (categoriesResponse.ok) {
            const data = await categoriesResponse.json();
            setCategories(Array.isArray(data) ? data : []);
          }
        }
      } catch (error) {
        alert('Failed to create category');
      }
    };

    const handleDeleteCategory = async (categoryId) => {
      if (window.confirm('Are you sure you want to delete this category?')) {
        try {
          const response = await fetch(`https://regalia-backend.vercel.app/api/categories/delete/${categoryId}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            alert('Category deleted successfully');
            const categoriesResponse = await fetch('https://regalia-backend.vercel.app/api/categories/all');
            if (categoriesResponse.ok) {
              const data = await categoriesResponse.json();
              setCategories(Array.isArray(data) ? data : []);
            }
            setFormData(prev => {
              const newLimits = { ...prev.limits };
              delete newLimits[categoryId];
              return { ...prev, limits: newLimits };
            });
          }
        } catch (error) {
          alert('Failed to delete category');
        }
      }
    };

    const CategoryForm = ({ onSave, onCancel }) => {
      const [categoryData, setCategoryData] = useState({ cateName: '', status: 'active' });
      
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Category</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name</label>
                <input
                  type="text"
                  value={categoryData.cateName}
                  onChange={(e) => setCategoryData(prev => ({ ...prev, cateName: e.target.value }))}
                  className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={categoryData.status}
                  onChange={(e) => setCategoryData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-3 rounded-lg border focus:outline-none focus:ring-2"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSave(categoryData)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save
              </button>
              <button
                onClick={onCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {plan ? 'Edit' : 'Add'} Plan Limits
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <select
              value={formData.ratePlan}
              onChange={(e) => setFormData(prev => ({ ...prev, ratePlan: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
            </select>
            <select
              value={formData.foodType}
              onChange={(e) => setFormData(prev => ({ ...prev, foodType: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="Veg">Veg</option>
              <option value="Non-Veg">Non-Veg</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium">Categories</h4>
              <button
                type="button"
                onClick={() => setShowCategoryForm(true)}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Add Category
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.filter(cat => cat.status === 'active').map(category => (
                <div key={category._id} className="relative">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium">
                      {category.cateName}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete category"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.limits?.[category._id] || formData.limits?.[category.cateName] || 0}
                    onChange={(e) => handleLimitChange(category._id, e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onSave(formData)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Save
            </button>
            {plan && plan._id && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete ${formData.ratePlan} - ${formData.foodType} plan?`)) {
                    onDelete(plan);
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Delete
              </button>
            )}
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
          
          {showCategoryForm && (
            <CategoryForm
              onSave={handleCreateCategory}
              onCancel={() => setShowCategoryForm(false)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 xs:p-4 sm:p-6">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 xs:gap-0 mb-4 xs:mb-6">
        <h2 className="text-lg xs:text-xl sm:text-2xl font-bold" style={{color: 'hsl(45, 100%, 20%)'}}>Plan Limit Manager</h2>
        <button
          onClick={() => setEditingPlan({})}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
        >
          Add New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6">
        {loading ? (
          <div className="col-span-full text-center py-6 xs:py-8 text-sm xs:text-base">Loading...</div>
        ) : limits.length === 0 ? (
          <div className="col-span-full text-center py-6 xs:py-8 text-sm xs:text-base">No plan limits found</div>
        ) : (
          limits.map(limit => (
            <div key={`${limit.ratePlan}-${limit.foodType}`} className="bg-white rounded-lg shadow-md p-3 xs:p-4">
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xs:gap-0 mb-3 xs:mb-4">
                <h3 className="text-base xs:text-lg font-semibold">
                  {limit.ratePlan} - {limit.foodType}
                </h3>
                <button
                  onClick={() => setEditingPlan(limit)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs xs:text-sm touch-manipulation"
                >
                  Edit
                </button>
              </div>
              
              <div className="space-y-1 xs:space-y-2 text-xs xs:text-sm">
                {Object.entries(limit.limits || {}).map(([categoryKey, value]) => {
                  const category = categories.find(cat => cat._id === categoryKey || cat.cateName === categoryKey);
                  return (
                    <div key={categoryKey} className="flex justify-between">
                      <span className="text-gray-600 truncate mr-2">{category?.cateName || categoryKey}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {editingPlan && (
        <PlanEditor
          plan={editingPlan}
          onSave={handleSave}
          onCancel={() => setEditingPlan(null)}
          onDelete={(planToDelete) => {
            handleDelete(planToDelete);
            setEditingPlan(null);
          }}
        />
      )}
    </div>
  );
};

export default PlanLimitManager;