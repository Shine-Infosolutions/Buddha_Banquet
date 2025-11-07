import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { AiFillFileExcel } from "react-icons/ai";
import { FiSearch, FiX, FiPlus, FiEdit, FiEye, FiFileText, FiTrash2, FiWifi, FiWifiOff, FiMenu } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

const ListBooking = ({ setSidebarOpen }) => {
  const tableRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);
  const [allData, setAllData] = useState([]);
  
  // Mock WebSocket for now
  const readyState = 0;
  const sendMessage = () => {};
  
  // Detect mobile view
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= 600 : false
  );
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem("role") || "Staff";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://regalia-backend.vercel.app/api/bookings/`
      );
      
      console.log('API Response:', response.data);
      
      let dataArray = [];
      
      // Handle different response structures
      if (response.data) {
        if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        }
      }
      
      if (dataArray.length > 0) {
        const processedData = dataArray.map((item) => {
          const totalAdvance = Array.isArray(item.advance) 
            ? item.advance.reduce((sum, payment) => sum + (payment.amount || 0), 0)
            : (typeof item.advance === 'number' ? item.advance : 0);
          
          return {
            ...item,
            advance: totalAdvance,
            total: item.total ?? 0,
            balance: item.balance ?? 0,
            startDate: item.eventDate || item.startDate,
          };
        }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        console.log('Processed Data:', processedData);
        setUserData(processedData);
        setTotalPages(processedData.length);
      } else {
        console.warn('No booking data found');
        setUserData([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Fetch Users Error:', error);
      setUserData([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const response = await axios.get(`https://regalia-backend.vercel.app/api/bookings/`);

      let dataArray = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          dataArray = response.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          dataArray = response.data.data;
        }
      }
      
      if (dataArray.length > 0) {
        console.log("All Data:", dataArray);
        setAllData(dataArray);
      }
    } catch (error) {
      console.error("All Data Error:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Add delay to prevent rapid API calls
    const timer = setTimeout(() => {
      fetchAllData();
      fetchUsers();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [currentPage]);



  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  //   DELETE
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      axios
        .delete(`https://regalia-backend.vercel.app/api/bookings/delete/${id}`)
        .then((res) => {
          console.log(res);
          if (res.data) {
            alert('Booking deleted successfully');
            fetchUsers();
          }
        })
        .catch((error) => {
          console.log(error);
          alert(error.response?.data?.message || 'Failed to delete booking');
          setLoading(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleDeleteModal = (product) => {
    console.log(product);
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (productToDelete == "delete-all") {
      handleDelete("delete-all");
    }
    handleDelete(productToDelete._id);
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = async () => {
    if (searchQuery.trim() !== "") {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://regalia-backend.vercel.app/api/bookings/search?q=${encodeURIComponent(searchQuery)}`
        );
        
        let dataArray = [];
        
        if (response.data) {
          if (Array.isArray(response.data)) {
            dataArray = response.data;
          } else if (response.data.success && Array.isArray(response.data.data)) {
            dataArray = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            dataArray = response.data.data;
          }
        }
        
        setUserData(dataArray);
        setTotalPages(dataArray.length);
      } catch (error) {
        console.error('Search Error:', error);
        setUserData([]);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    } else {
      fetchUsers();
    }
  };

  const debouncedSearch = debounce(handleSearch, 300);
  const handleChange = (e) => {
    const { value } = e.target;
    setSearchQuery(value);
    clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => debouncedSearch(), 800);
  };

  // CSV export headers and data transformation
  const csvHeaders = [
    { label: "Name", key: "name" },
    { label: "Number", key: "number" },
    { label: "Email", key: "email" },
    { label: "WhatsApp Number", key: "whatsapp" },
    { label: "Paxs", key: "pax" },
    { label: "Booking Date", key: "startDate" },
    { label: "Food Type", key: "foodType" },
    { label: "Rate Plan", key: "ratePlan" },
    { label: "Advance", key: "advance" },
    { label: "GST", key: "gst" },
    { label: "Total Amount", key: "total" },
    { label: "Balance", key: "balance" },
    { label: "Rate Per Pax", key: "ratePerPax" },
    { label: "Hall", key: "hall" },
    { label: "Time", key: "time" },
    { label: "Discount", key: "discount" },
    { label: "Customer Reference", key: "customerRef" },
    { label: "Status", key: "bookingStatus" },
  ];

  const csvData = allData.map((item) => {
    const getStringValue = (value) => {
      if (typeof value === 'object' && value !== null) {
        return value.amount || value.value || JSON.stringify(value) || "";
      }
      return value || "";
    };
    
    return {
      name: getStringValue(item.name),
      number: getStringValue(item.number),
      whatsapp: getStringValue(item.whatsapp),
      pax: getStringValue(item.pax),
      startDate: item.startDate
        ? new Date(item.startDate).toLocaleDateString('en-GB')
        : "",
      foodType: getStringValue(item.foodType),
      ratePlan: getStringValue(item.ratePlan),
      advance: getStringValue(item.advance),
      gst: getStringValue(item.gst),
      total: getStringValue(item.total),
      balance: getStringValue(item.balance),
      ratePerPax: getStringValue(item.ratePerPax),
      hall: getStringValue(item.hall),
      time: getStringValue(item.time),
      discount: getStringValue(item.discount),
      customerRef: getStringValue(item.customerRef),
      bookingStatus: getStringValue(item.bookingStatus),
    };
  });

  // handle toggle

  const handleToggleStatus = async (id, currentStatus) => {
    const updatedStatus = !currentStatus;

    // Optimistic UI update
    setUserData((prevData) =>
      prevData.map((user) =>
        user._id === id ? { ...user, status: updatedStatus } : user
      )
    );

    try {
      const response = await axios.put(
        `https://regalia-backend.vercel.app/little/achiver/update-status/${id}`,
        { status: updatedStatus }
      );
      
      if (response.data) {
        console.log("Status updated successfully:", response.data);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert the status change if the update failed
      setUserData((prevData) =>
        prevData.map((user) =>
          user._id === id ? { ...user, status: currentStatus } : user
        )
      );
    }
  };

  const renderPagination = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5; // Adjust this value to change the number of visible pages
    const maxPage = Math.ceil(totalPages / 10);

    for (let i = 1; i <= maxPage; i++) {
      pageNumbers.push(i);
    }

    let startPage;
    let endPage;

    if (maxPage <= maxPagesToShow) {
      startPage = 1;
      endPage = maxPage;
    } else {
      if (currentPage <= maxPagesToShow - 2) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + 1 >= maxPage) {
        startPage = maxPage - maxPagesToShow + 1;
        endPage = maxPage;
      } else {
        startPage = currentPage - 2; // Adjust the number of pages to show before and after the current page
        endPage = currentPage + 2; // Adjust the number of pages to show before and after the current page
      }
    }

    const visiblePages = pageNumbers.slice(startPage - 1, endPage);
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === maxPage;

    return (
      <nav className="mt-12 flex justify-center">
        <ul className="join ">
          <li className="page-item">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              className={`px-4 py-2 cursor-pointer rounded-md  mx-1 ${
                isFirstPage ? "disabled" : ""
              }`}
              disabled={isFirstPage}
            >
              Previous
            </button>
          </li>
          {visiblePages?.map((number) => (
            <li key={number} className="page-item">
              <button
                onClick={() => handlePageChange(number)}
                className={`${
                  currentPage === number ? "bg-gray-400 text-white" : ""
                } px-4 py-2 mx-1 rounded-md`}
              >
                {number}
              </button>
            </li>
          ))}
          <li className="page-item">
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              className={`px-4 py-2 cursor-pointer mx-1 bg-black rounded-md text-white ${
                isLastPage ? "disabled" : ""
              }`}
              disabled={isLastPage}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  // Function to handle CSV download
  const handleDownloadCSV = () => {
    const table = tableRef.current;
    if (!table) return;

    // Extract table data
    const rows = Array.from(table.querySelectorAll("tr"));
    const csvData = rows
      .map((row) =>
        Array.from(row.querySelectorAll("th, td"))
          .map((cell) => cell.innerText)
          .join(",")
      )
      .join("\n");

    // Trigger download
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Staff-Detail.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (pageLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(45, 100%, 95%)'}}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Hamburger Menu for Mobile */}
            <button
              onClick={() => setSidebarOpen && setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-[#c3ad6b] text-white hover:bg-[#b39b5a] transition-colors"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold" style={{color: 'hsl(45, 100%, 20%)'}}>
              Booking List
            </h1>
          </div>
          {isMobile && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c3ad6b]/10 text-[#c3ad6b] font-semibold text-sm shadow">
              {userRole === "Admin" ? "👑 Admin" : "👤 Staff"}
            </span>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-[#c3ad6b]/20 p-2 rounded-full">
                  <FiPlus className="text-[#c3ad6b] text-lg" />
                </div>
                <h2 className="text-xl font-semibold" style={{color: 'hsl(45, 100%, 20%)'}}>
                  Manage Bookings
                </h2>

              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to={"/add-booking"}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg shadow transition-colors font-semibold"
                  style={{backgroundColor: 'hsl(45, 43%, 58%)'}}
                >
                  <FiPlus className="text-lg" />
                  Add Booking
                </Link>
                <button
                  onClick={() => alert('CSV export feature coming soon')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 transition-colors font-semibold"
                >
                  <AiFillFileExcel className="text-lg" />
                  Download CSV
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="form-control relative flex items-center max-w-md mx-auto mb-6">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                className="input input-bordered pl-10 pr-10 py-2 rounded-full w-full shadow-sm focus:ring-2 focus:ring-[#c3ad6b]"
                type="text"
                value={searchQuery}
                onChange={handleChange}
                placeholder="Search By Name, Phone"
              />
              {searchQuery && (
                <span
                  onClick={() => {
                    setSearchQuery("");
                    fetchUsers();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-red-500 hover:text-red-700 text-lg"
                >
                  <FiX />
                </span>
              )}
            </div>

            {/* Table */}
            <div className="mt-6 bg-gold/10 shadow-xl rounded-2xl overflow-x-auto p-2 sm:p-4">
              {loading ? (
                <div className="flex items-center justify-center m-auto py-16">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#c3ad6b]"></div>
                </div>
              ) : userData && userData.length > 0 ? (
                <>
                  {/* Card view for mobile */}
                  <div className="block sm:hidden">
                    <div className="grid grid-cols-1 gap-4">
                      {userData?.map((item) => (
                        <div
                          key={item._id}
                          className="bg-white rounded-xl shadow p-4 flex flex-col border border-gray-100"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-#c3ad6b rounded-full flex items-center justify-center text-black font-bold text-lg">
                              {item.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="font-bold text-lg">{item.name}</div>
                              <div className="text-gray-500 text-sm">
                                {item.phone || item.number}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 text-sm mb-2">
                            <div>
                              <span className="font-semibold">Event Date:</span>{" "}
                              {new Date(item.eventDate || item.startDate).toLocaleDateString('en-GB')}
                            </div>
                            <div>
                              <span className="font-semibold">Rate Plan:</span>{" "}
                              {item.ratePlan}
                            </div>
                            <div>
                              <span className="font-semibold">Type:</span>{" "}
                              {item.foodType}
                            </div>
                            <div>
                              <span className="font-semibold">Advance:</span>{" "}
                              ₹{item?.advance !== null && item?.advance !== undefined
                                ? item?.advance
                                : 0}
                            </div>
                            <div>
                              <span className="font-semibold">Total Amount:</span>{" "}
                              ₹{item.total || 0}
                            </div>
                            <div>
                              <span className="font-semibold">Status:</span>{" "}
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                item.bookingStatus === 'Confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : item.bookingStatus === 'Tentative'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.bookingStatus}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Link
                              to={`/banquet/update-booking/${item._id}`}
                              className="flex-1 inline-flex items-center justify-center gap-1 bg-[#c3ad6b] hover:bg-[#b39b5a] text-white px-3 py-2 rounded shadow text-xs font-semibold transition-colors"
                              title="Edit Booking"
                            >
                              <FiEdit /> Edit
                            </Link>
                            <Link
                              to={`/banquet/menu-view/${item._id}`}
                              className="flex-1 inline-flex items-center justify-center gap-1 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 transition-colors font-semibold px-3 py-2 text-xs"
                              title="View Menu"
                            >
                              <FiEye /> View Menu
                            </Link>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Link
                              to={`/banquet/invoice/${item._id}`}
                              className="flex-1 inline-flex items-center justify-center gap-1 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold px-3 py-2 text-xs"
                              title="Generate Invoice"
                            >
                              <FiFileText /> Invoice
                            </Link>
                            {/* <button
                              className="flex-1 inline-flex items-center justify-center gap-1 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition-colors font-semibold px-3 py-2 text-xs"
                            >
                              <FiFileText /> Chef Invoice
                            </button> */}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => {
                                let raw = String(item.whatsapp || item.number || "").replace(/[^\d]/g, "");
                                raw = raw.replace(/^0+/, "");
                                let phoneNumber = "";
                                if (raw.length === 10) {
                                  phoneNumber = `91${raw}`;
                                } else if (raw.length === 12 && raw.startsWith("91")) {
                                  phoneNumber = raw;
                                } else {
                                  alert("Invalid phone number for WhatsApp. Must be 10 digits (India) or 12 digits with country code.");
                                  return;
                                }
                                const message = `🌟 *Welcome to Hotel ASHOKA HOTEL!* 🌟\n\nHere's your booking confirmation:\n\n📅 *Date:* ${new Date(item.startDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n⏰ *Time:* ${item.time || "To be confirmed"}\n👨👩👧👦 *Guest Name:* ${item.name}\n📞 *Contact:* ${item.number}\n🍽️ *Plan:* ${item.ratePlan}\n🥗 *Food Type:* ${item.foodType}\n🏛️ *Hall/Area:* ${item.hall}\n👥 *Pax:* ${item.pax || "To be confirmed"}\n🔄 *Status:* ${item.bookingStatus}\n\n💰 *Payment Details:*\n💵 *Total Amount:* ₹${item.total || "To be confirmed"}\n💳 *Advance Paid:* ₹${item.advance}\n💸 *Balance Due:* ₹${item.balance || (item.total - item.advance) || "To be confirmed"}\n\n📍 *Venue Address:* Medical Road, Gorakhpur\n\nThank you for choosing us! We look forward to serving you. 🙏\n\n`;
                                const whatsappUrl = `https://web.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
                                window.open(whatsappUrl, "_blank");
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition-colors font-semibold px-3 py-2 text-xs"
                              title="Send WhatsApp Message"
                            >
                              <FaWhatsapp /> WhatsApp
                            </button>
                            <button
                              onClick={() => handleDeleteModal(item)}
                              className="flex-1 inline-flex items-center justify-center gap-1 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-colors font-semibold px-3 py-2 text-xs"
                              title="Delete Booking"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Table view for desktop/tablet */}
                  <div className="hidden sm:block">
                    <table
                      ref={tableRef}
                      className="w-full table-auto text-sm text-left border-separate border-spacing-y-2"
                    >
                      <thead className="bg-gold text-black font-semibold sticky top-0 z-10">
                        <tr>
                          <th className="py-3 px-6 rounded-tl-xl">Name</th>
                          <th className="py-3 px-6">Number</th>
                          <th className="py-3 px-6">Booking Date</th>
                          <th className="py-3 px-6">Rate Plan</th>
                          <th className="py-3 px-6">Type</th>
                          <th className="py-3 px-6">Advance</th>
                          <th className="py-3 px-6">Total Amount</th>
                          <th className="py-3 px-6">Hall</th>
                          <th className="py-3 px-6">Status</th>
                          <th className="py-3 px-6 rounded-tr-xl">Action</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-700">
                        {userData?.map((item, idx) => (
                          <tr
                            key={item._id}
                            className={
                              idx % 2 === 0
                                ? "bg-gray-50 hover:bg-[#c3ad6b]/20 transition-colors"
                                : "bg-white hover:bg-[#c3ad6b]/20 transition-colors"
                            }
                          >
                            <td className="px-6 py-4 whitespace-nowrap font-bold flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#c3ad6b]/20 rounded-full flex items-center justify-center text-[#c3ad6b] font-bold text-base">
                                {item.name?.[0]?.toUpperCase() || "?"}
                              </div>
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.phone || item.number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(item.eventDate || item.startDate).toLocaleDateString('en-GB')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.ratePlan}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.foodType}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              ₹{item.advance || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              ₹{item.total || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {item.hall}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                item.bookingStatus === 'Confirmed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : item.bookingStatus === 'Tentative'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {item.bookingStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                <Link
                                  to={`/banquet/update-booking/${item._id}`}
                                  className="inline-flex items-center gap-1 bg-[#c3ad6b] hover:bg-[#b39b5a] text-white px-2 py-1 rounded text-xs font-semibold transition-colors"
                                  title="Edit Booking"
                                >
                                  <FiEdit /> Edit
                                </Link>
                                <Link
                                  to={`/banquet/menu-view/${item._id}`}
                                  className="inline-flex items-center gap-1 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 transition-colors font-semibold px-2 py-1 text-xs"
                                  title="View Menu"
                                >
                                  <FiEye /> Menu
                                </Link>
                                <Link
                                  to={`/banquet/invoice/${item._id}`}
                                  className="inline-flex items-center gap-1 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold px-2 py-1 text-xs"
                                  title="Invoice"
                                >
                                  <FiFileText /> Invoice
                                </Link>
                                <button
                                  onClick={() => {
                                    let raw = String(item.whatsapp || item.number || "").replace(/[^\d]/g, "");
                                    raw = raw.replace(/^0+/, "");
                                    let phoneNumber = "";
                                    if (raw.length === 10) {
                                      phoneNumber = `91${raw}`;
                                    } else if (raw.length === 12 && raw.startsWith("91")) {
                                      phoneNumber = raw;
                                    } else {
                                      alert("Invalid phone number for WhatsApp. Must be 10 digits (India) or 12 digits with country code.");
                                      return;
                                    }
                                    const message = `🌟 *Welcome to Hotel ASHOKA HOTEL!* 🌟\n\nHere's your booking confirmation:\n\n📅 *Date:* ${new Date(item.startDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n⏰ *Time:* ${item.time || "To be confirmed"}\n👨👩👧👦 *Guest Name:* ${item.name}\n📞 *Contact:* ${item.number}\n🍽️ *Plan:* ${item.ratePlan}\n🥗 *Food Type:* ${item.foodType}\n🏛️ *Hall/Area:* ${item.hall}\n👥 *Pax:* ${item.pax || "To be confirmed"}\n🔄 *Status:* ${item.bookingStatus}\n\n💰 *Payment Details:*\n💵 *Total Amount:* ₹${item.total || "To be confirmed"}\n💳 *Advance Paid:* ₹${item.advance}\n💸 *Balance Due:* ₹${item.balance || (item.total - item.advance) || "To be confirmed"}\n\n📍 *Venue Address:* Medical Road, Gorakhpur\n\nThank you for choosing us! We look forward to serving you. 🙏\n\n`;
                                    const whatsappUrl = `https://web.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
                                    window.open(whatsappUrl, "_blank");
                                  }}
                                  className="inline-flex items-center gap-1 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition-colors font-semibold px-2 py-1 text-xs"
                                  title="Send WhatsApp Message"
                                >
                                  <FaWhatsapp /> WhatsApp
                                </button>
                                <button
                                  onClick={() => handleDeleteModal(item)}
                                  className="inline-flex items-center gap-1 bg-red-600 text-white rounded shadow hover:bg-red-700 transition-colors font-semibold px-2 py-1 text-xs"
                                  title="Delete Booking"
                                >
                                  <FiTrash2 /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center w-full m-auto">
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="text-gray-300 mb-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 17v-2a4 4 0 014-4h3m4 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h6a3 3 0 013 3v1"
                    />
                  </svg>
                  <p className="font-semibold text-gray-400 text-lg">
                    No Booking Found!
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="mt-6">
              <nav className="flex justify-center">
                <ul className="flex items-center space-x-2">
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        currentPage === 1 
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" 
                          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                      }`}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  
                  {(() => {
                    const maxPage = Math.ceil(totalPages / 10);
                    const pages = [];
                    for (let i = 1; i <= Math.min(maxPage, 5); i++) {
                      pages.push(
                        <li key={i}>
                          <button
                            onClick={() => handlePageChange(i)}
                            className={`px-4 py-2 rounded-md border transition-colors ${
                              currentPage === i
                                ? "bg-[#c3ad6b] text-white border-[#c3ad6b]"
                                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                            }`}
                          >
                            {i}
                          </button>
                        </li>
                      );
                    }
                    return pages;
                  })()}
                  
                  <li>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={`px-4 py-2 rounded-md border transition-colors ${
                        currentPage === Math.ceil(totalPages / 10)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                      }`}
                      disabled={currentPage === Math.ceil(totalPages / 10)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Delete Modal */}
            {isDeleteModalOpen && productToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Delete Booking
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this booking? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={cancelDelete}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ListBooking;