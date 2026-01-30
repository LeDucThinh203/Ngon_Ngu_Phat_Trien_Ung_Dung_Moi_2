const API_URL = 'https://api.escuelajs.co/api/v1/products';

// State management
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let pageSize = 10;
let currentSort = null;

// Helper function to create SVG placeholder with product name
const createPlaceholder = (productName = 'Product') => {
    const name = productName.substring(0, 20); // Limit length
    return `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop offset="0%25" stop-color="%234CAF50"/%3E%3Cstop offset="100%25" stop-color="%232196F3"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="100" height="100"/%3E%3Ctext fill="white" font-family="Arial" font-size="10" font-weight="bold" x="50%25" y="45%25" text-anchor="middle" dy=".3em"%3E📦%3C/text%3E%3Ctext fill="white" font-family="Arial" font-size="8" x="50%25" y="65%25" text-anchor="middle"%3E${encodeURIComponent(name)}%3C/text%3E%3C/svg%3E`;
};

// Helper function to clean and validate image URL
const getValidImageUrl = (images, category, productName) => {
    // List of known placeholder services to skip
    const placeholderServices = [
        'placeimg.com',
        'placeholder.com', 
        'placehold.co',
        'via.placeholder',
        'dummyimage.com',
        'placekitten.com'
    ];
    
    // Try all images in the array
    if (images && Array.isArray(images) && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
            let imageUrl = images[i];
            
            if (!imageUrl || typeof imageUrl !== 'string') continue;
            
            // Remove quotes, brackets, and extra whitespace
            imageUrl = imageUrl.replace(/[\[\]"']/g, '').trim();
            
            // Skip empty strings
            if (!imageUrl) continue;
            
            // Skip known placeholder services
            const isPlaceholder = placeholderServices.some(service => imageUrl.includes(service));
            if (isPlaceholder) continue;
            
            // Accept ALL valid HTTP/HTTPS URLs
            if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                return imageUrl;
            }
        }
    }
    
    // Fallback to category image if available
    if (category && category.image) {
        let catImage = category.image.replace(/[\[\]"']/g, '').trim();
        const isPlaceholder = placeholderServices.some(service => catImage.includes(service));
        if (catImage.startsWith('http://') || catImage.startsWith('https://')) {
            if (!isPlaceholder) {
                return catImage;
            }
        }
    }
    
    // Final fallback: beautiful placeholder with product name
    return createPlaceholder(productName || 'Product');
};

// Load all products
const getAllProducts = async () => {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allProducts = data;
        filteredProducts = [...allProducts];
        renderTable();
        renderPagination();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('tableContainer').innerHTML = '<div class="loading">Lỗi tải dữ liệu!</div>';
    }
};

// Render table
const renderTable = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Hình ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th>Mô tả</th>
                    <th>Giá ($)</th>
                    <th>Danh mục</th>
                </tr>
            </thead>
            <tbody>
                ${paginatedProducts.map(product => `
                    <tr>
                        <td>${product.id}</td>
                        <td>
                            <img src="${getValidImageUrl(product.images, product.category, product.title)}" 
                                 alt="${product.title}" 
                                 class="product-image"
                                 loading="lazy"
                                 onerror="this.onerror=null; this.src='${createPlaceholder(product.title)}';" />
                        </td>
                        <td class="product-title">${product.title}</td>
                        <td class="product-description">${product.description || 'Không có mô tả'}</td>
                        <td class="product-price">$${product.price}</td>
                        <td>${product.category?.name || 'N/A'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    document.getElementById('tableContainer').innerHTML = tableHTML;
};

// Render pagination
const renderPagination = () => {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    
    const paginationHTML = `
        <button onclick="goToPage(1)" ${currentPage === 1 ? 'disabled' : ''}>⏮️ Đầu</button>
        <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>◀️ Trước</button>
        <span>Trang ${currentPage} / ${totalPages} (${filteredProducts.length} sản phẩm)</span>
        <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Sau ▶️</button>
        <button onclick="goToPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>Cuối ⏭️</button>
    `;
    
    document.getElementById('paginationContainer').innerHTML = paginationHTML;
};

// Go to specific page
const goToPage = (page) => {
    const totalPages = Math.ceil(filteredProducts.length / pageSize);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
    renderPagination();
};

// Change page size
const changePageSize = () => {
    pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    currentPage = 1;
    renderTable();
    renderPagination();
};

// Search by title
const handleSearch = () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    
    // Re-apply current sort if any
    if (currentSort) {
        applySort(currentSort.type, currentSort.order);
    }
    
    renderTable();
    renderPagination();
};

// Apply sort
const applySort = (type, order) => {
    if (type === 'price') {
        filteredProducts.sort((a, b) => {
            return order === 'asc' ? a.price - b.price : b.price - a.price;
        });
    } else if (type === 'name') {
        filteredProducts.sort((a, b) => {
            const nameA = a.title.toLowerCase();
            const nameB = b.title.toLowerCase();
            if (order === 'asc') {
                return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
            } else {
                return nameA > nameB ? -1 : nameA < nameB ? 1 : 0;
            }
        });
    }
};

// Sort by price
const sortByPrice = (order) => {
    currentSort = { type: 'price', order };
    applySort('price', order);
    currentPage = 1;
    renderTable();
    renderPagination();
    updateActiveButton();
};

// Sort by name
const sortByName = (order) => {
    currentSort = { type: 'name', order };
    applySort('name', order);
    currentPage = 1;
    renderTable();
    renderPagination();
    updateActiveButton();
};

// Update active button styling
const updateActiveButton = () => {
    document.querySelectorAll('.sort-controls button').forEach(btn => {
        btn.classList.remove('active');
    });
};

// Initialize
window.onload = () => {
    getAllProducts();
};