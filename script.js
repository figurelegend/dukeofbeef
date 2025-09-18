// Alternative script.js for private Google Sheets using Apps Script Web App
let products = [];
let orderItems = {};

// Replace with your Google Apps Script Web App URLs
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzz7wm_ak0zOuFecSrry0A61Os7Ba0NwiHKFy-GLTQXLGD4BRWi_wCoMvV8t_8DlV3o/exec';

// Orders submission script URL (you'll create and deploy this separately)
const ORDERS_SCRIPT_URL = 'YOUR_ORDERS_SCRIPT_URL_HERE';

document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("YOUR_EMAILJS_PUBLIC_KEY");

    document.getElementById('fullName').addEventListener('blur', validateName);
    document.getElementById('email').addEventListener('blur', validateEmail);
    document.getElementById('phone').addEventListener('blur', validatePhone);
    document.getElementById('submitOrder').addEventListener('click', showConfirmation);
    document.getElementById('confirmSubmit').addEventListener('click', submitOrder);
    document.getElementById('cancelSubmit').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);

    // Delivery method listeners
    document.getElementById('deliveryOption').addEventListener('change', updateOrderTotal);
    document.getElementById('shippingOption').addEventListener('change', updateOrderTotal);


    loadProductsFromPrivateSheet();
});

function loadProductsFromPrivateSheet() {
    fetch(GOOGLE_SCRIPT_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            return response.json();
        })
        .then(data => {
            if (data.success && data.values && data.values.length > 0) {
                parseGoogleSheetData(data.values);
                document.getElementById('loadingMessage').style.display = 'none';
            } else {
                throw new Error(data.error || 'No data found');
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            document.getElementById('loadingMessage').innerHTML = `
                <p style="color: #e74c3c;">Error loading products.</p>
                <p style="font-size: 14px; color: #666;">Please check the configuration.</p>
            `;
        });
}

function parseGoogleSheetData(rows) {
    if (rows.length < 2) return;

    const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
    products = [];
    orderItems = {};

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length > 0 && row[0]) {
            const product = {};
            headers.forEach((header, index) => {
                product[header] = row[index] || '';
            });
            products.push(product);
        }
    }

    displayProducts();
}

function displayProducts() {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    // Group products by category
    const categories = {};
    products.forEach((product, index) => {
        const category = product.category || 'Other';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push({ ...product, originalIndex: index });
    });


    // Display each category section
    Object.keys(categories).forEach(categoryName => {
        // Create category header
        const categorySection = document.createElement('div');
        categorySection.className = 'category-section';

        const categoryHeader = document.createElement('h3');
        categoryHeader.className = 'category-header';
        categoryHeader.textContent = categoryName;
        categorySection.appendChild(categoryHeader);

        // Create products grid for this category
        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'category-grid';

        categories[categoryName].forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            const imageUrl = getImageUrl(product.image);
            const price = parseFloat(product.retail) || 0;
            const minQty = parseInt(product.minimum_order_quantity) || 1;

            const imgId = `product-img-${product.originalIndex}`;
            productCard.innerHTML = `
                <div class="product-image">
                    <img id="${imgId}" src="images/placeholder.png" alt="${product.item_description}">
                </div>
                <div class="product-info">
                    <h3>${product.item_description}</h3>
                    <p class="price">$${price.toFixed(2)}</p>
                    <p class="min-qty">Minimum Order: ${minQty}</p>
                    <div class="quantity-control">
                        <button class="qty-btn minus" data-index="${product.originalIndex}">-</button>
                        <input type="number" class="qty-input" id="qty-${product.originalIndex}"
                               min="0" value="0" data-index="${product.originalIndex}">
                        <button class="qty-btn plus" data-index="${product.originalIndex}">+</button>
                    </div>
                </div>
            `;

            categoryGrid.appendChild(productCard);
        });

        categorySection.appendChild(categoryGrid);
        container.appendChild(categorySection);
    });

    // Load all images after all products are added to DOM
    products.forEach((product, index) => {
        const imgElement = document.getElementById(`product-img-${index}`);
        if (imgElement) {
            loadProductImage(imgElement, product.image, product.item_description);
        }
    });

    attachQuantityListeners();
}

// Cache for found images
const imageCache = {};

function getImageUrl(imageValue) {
    if (!imageValue) return 'images/placeholder.png';

    // If it's a full URL, use it directly
    if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
        return imageValue;
    }

    // If it already has an extension, use it as-is
    const extensions = ['.jpg', '.png', '.jpeg'];
    for (let ext of extensions) {
        if (imageValue.toLowerCase().includes(ext)) {
            return `images/${imageValue}`;
        }
    }

    // Simple approach: just try the tag with .jpg extension
    // The loadProductImage function will handle trying other extensions if needed
    return `images/${imageValue}.jpg`;
}

// Enhanced image loading with multiple attempts
function loadProductImage(imgElement, imageValue, productName) {
    if (!imageValue) {
        imgElement.src = 'images/placeholder.png';
        return;
    }

    // If it's a URL or already has extension, use directly
    if (imageValue.includes('http') || imageValue.includes('.')) {
        imgElement.src = getImageUrl(imageValue);
        return;
    }

    // Try different extensions in order
    const extensions = ['.jpg', '.jpeg', '.png'];
    let attemptIndex = 0;

    function tryNextExtension() {
        if (attemptIndex < extensions.length) {
            const url = `images/${imageValue}${extensions[attemptIndex]}`;
            attemptIndex++;

            // Create a test image to check if it loads
            const testImg = new Image();
            testImg.onload = () => {
                imgElement.src = url;
            };
            testImg.onerror = () => {
                tryNextExtension();
            };
            testImg.src = url;
        } else {
            // If none work, use placeholder
            imgElement.src = 'images/placeholder.png';
        }
    }

    tryNextExtension();
}

function attachQuantityListeners() {
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.dataset.index;
            const input = document.getElementById(`qty-${index}`);
            const minQty = parseInt(products[index].minimum_order_quantity) || 1;
            const currentValue = parseInt(input.value) || 0;

            if (currentValue > minQty) {
                input.value = currentValue - 1;
            } else if (currentValue === minQty) {
                input.value = 0;
            }
            updateOrderItem(index, input.value);
        });
    });

    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.dataset.index;
            const input = document.getElementById(`qty-${index}`);
            const minQty = parseInt(products[index].minimum_order_quantity) || 1;
            const currentValue = parseInt(input.value) || 0;

            if (currentValue === 0) {
                input.value = minQty;
            } else {
                input.value = currentValue + 1;
            }
            updateOrderItem(index, input.value);
        });
    });

    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', function() {
            const index = this.dataset.index;
            const minQty = parseInt(products[index].minimum_order_quantity) || 1;
            let value = parseInt(this.value) || 0;

            // If value is between 1 and minQty, set to minQty
            if (value > 0 && value < minQty) {
                value = minQty;
                this.value = value;
                alert(`Minimum order quantity is ${minQty}`);
            }

            updateOrderItem(index, value);
        });
    });
}

function updateOrderItem(index, quantity) {
    const product = products[index];
    const qty = parseInt(quantity) || 0;

    if (qty > 0) {
        orderItems[index] = {
            product: product,
            quantity: qty
        };
    } else {
        delete orderItems[index];
    }

    updateOrderTotal();
    checkFormValidity();
}

function updateOrderTotal() {
    let subtotal = 0;

    for (let key in orderItems) {
        const item = orderItems[key];
        const price = parseFloat(item.product.retail) || 0;
        subtotal += price * item.quantity;
    }

    // Always update subtotal
    const subtotalElement = document.getElementById('subtotalAmount');
    if (subtotalElement) {
        subtotalElement.textContent = subtotal.toFixed(2);
    }

    // Handle delivery/shipping fees
    const deliveryOption = document.getElementById('deliveryOption');
    const shippingOption = document.getElementById('shippingOption');
    const totalElement = document.getElementById('totalAmount');

    if (!totalElement) return; // Exit if elements don't exist yet

    let total = subtotal;

    if (deliveryOption && deliveryOption.checked) {
        total += 20.00;
        totalElement.textContent = total.toFixed(2);
    } else if (shippingOption && shippingOption.checked) {
        totalElement.textContent = subtotal.toFixed(2); // Show subtotal for shipping
    } else {
        totalElement.textContent = subtotal.toFixed(2);
    }
}

function validateName() {
    const nameInput = document.getElementById('fullName');
    const errorSpan = document.getElementById('nameError');

    if (nameInput.value.trim().length < 2) {
        errorSpan.textContent = 'Please enter your full name';
        nameInput.classList.add('invalid');
        return false;
    }

    errorSpan.textContent = '';
    nameInput.classList.remove('invalid');
    return true;
}

function validateEmail() {
    const emailInput = document.getElementById('email');
    const errorSpan = document.getElementById('emailError');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(emailInput.value)) {
        errorSpan.textContent = 'Please enter a valid email address';
        emailInput.classList.add('invalid');
        return false;
    }

    errorSpan.textContent = '';
    emailInput.classList.remove('invalid');
    return true;
}

function validatePhone() {
    const phoneInput = document.getElementById('phone');
    const errorSpan = document.getElementById('phoneError');
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    const cleanPhone = phoneInput.value.replace(/\D/g, '');

    if (!phoneRegex.test(phoneInput.value) || cleanPhone.length < 10) {
        errorSpan.textContent = 'Please enter a valid phone number (at least 10 digits)';
        phoneInput.classList.add('invalid');
        return false;
    }

    errorSpan.textContent = '';
    phoneInput.classList.remove('invalid');
    return true;
}

function checkFormValidity() {
    const isNameValid = document.getElementById('fullName').value.trim().length >= 2;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('email').value);
    const isPhoneValid = document.getElementById('phone').value.replace(/\D/g, '').length >= 10;
    const hasItems = Object.keys(orderItems).length > 0;

    document.getElementById('submitOrder').disabled = !(isNameValid && isEmailValid && isPhoneValid && hasItems);
}

function showConfirmation() {
    if (!validateName() || !validateEmail() || !validatePhone()) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    // Check if delivery method is selected
    const deliveryOption = document.getElementById('deliveryOption');
    const shippingOption = document.getElementById('shippingOption');
    if (!deliveryOption.checked && !shippingOption.checked) {
        alert('Please select delivery or shipping method.');
        return;
    }

    const modal = document.getElementById('confirmationModal');
    const details = document.getElementById('confirmationDetails');

    let orderHtml = '<h3>Customer Information</h3>';
    orderHtml += `<p><strong>Name:</strong> ${document.getElementById('fullName').value}</p>`;
    orderHtml += `<p><strong>Email:</strong> ${document.getElementById('email').value}</p>`;
    orderHtml += `<p><strong>Phone:</strong> ${document.getElementById('phone').value}</p>`;

    // Add delivery method
    const deliveryMethod = deliveryOption.checked ? 'Delivery ($20.00)' : 'Shipping (Call for Cost)';
    orderHtml += `<p><strong>Method:</strong> ${deliveryMethod}</p>`;

    orderHtml += '<h3>Order Items</h3>';
    orderHtml += '<table class="order-summary"><thead><tr><th>Item</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead><tbody>';

    let subtotal = 0;
    for (let key in orderItems) {
        const item = orderItems[key];
        const price = parseFloat(item.product.retail) || 0;
        const total = price * item.quantity;
        subtotal += total;

        orderHtml += `<tr>
            <td>${item.product.item_description}</td>
            <td>${item.quantity}</td>
            <td>$${price.toFixed(2)}</td>
            <td>$${total.toFixed(2)}</td>
        </tr>`;
    }

    orderHtml += `</tbody></table>`;

    orderHtml += `<div class="totals-section">`;
    orderHtml += `<p><strong>Subtotal: $${subtotal.toFixed(2)}</strong></p>`;

    if (deliveryOption.checked) {
        orderHtml += `<p><strong>Delivery: $20.00</strong></p>`;
        orderHtml += `<h3>Total: $${(subtotal + 20).toFixed(2)}</h3>`;
    } else {
        orderHtml += `<p><strong>Shipping: Call for Cost</strong></p>`;
        orderHtml += `<h3>Total: Call for Total</h3>`;
    }
    orderHtml += `</div>`;

    details.innerHTML = orderHtml;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

function submitOrder() {
    const customerName = document.getElementById('fullName').value;
    const customerEmail = document.getElementById('email').value;
    const customerPhone = document.getElementById('phone').value;
    const deliveryOption = document.getElementById('deliveryOption');
    const deliveryMethod = deliveryOption.checked ? 'delivery' : 'shipping';

    // Prepare order data for Google Apps Script
    const orderData = {
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        deliveryMethod: deliveryMethod,
        items: []
    };

    // Add items to order
    for (let key in orderItems) {
        const item = orderItems[key];
        const price = parseFloat(item.product.retail) || 0;

        orderData.items.push({
            name: item.product.item_description,
            quantity: item.quantity,
            price: price
        });
    }

    // If Google Apps Script URL is configured, use it
    if (ORDERS_SCRIPT_URL && ORDERS_SCRIPT_URL !== 'YOUR_ORDERS_SCRIPT_URL_HERE') {
        submitToGoogleSheet(orderData);
    } else {
        // Fallback to EmailJS if available
        submitViaEmailJS(orderData);
    }
}

function submitToGoogleSheet(orderData) {
    // Show loading state
    const submitButton = document.getElementById('confirmSubmit');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Submitting...';
    submitButton.disabled = true;

    fetch(ORDERS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
    })
    .then(() => {
        // With no-cors, we can't read the response, but if no error, assume success
        alert('Order submitted successfully! You will receive a confirmation email shortly.');
        resetForm();
        closeModal();
    })
    .catch(error => {
        console.error('Order submission error:', error);
        // Try EmailJS as fallback
        submitViaEmailJS(orderData);
    })
    .finally(() => {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

function submitViaEmailJS(orderData) {
    // Build order details string for EmailJS
    let orderDetails = `Customer Information:\n`;
    orderDetails += `Name: ${orderData.customerName}\n`;
    orderDetails += `Email: ${orderData.customerEmail}\n`;
    orderDetails += `Phone: ${orderData.customerPhone}\n`;
    orderDetails += `Method: ${orderData.deliveryMethod === 'delivery' ? 'Delivery ($20.00)' : 'Shipping (Call for Cost)'}\n\n`;

    orderDetails += `Order Items:\n`;
    orderDetails += `----------------------------------------\n`;

    let subtotal = 0;
    orderData.items.forEach(item => {
        const total = item.price * item.quantity;
        subtotal += total;
        orderDetails += `${item.name}\n`;
        orderDetails += `Quantity: ${item.quantity} @ $${item.price.toFixed(2)} each = $${total.toFixed(2)}\n`;
        orderDetails += `----------------------------------------\n`;
    });

    orderDetails += `\nSubtotal: $${subtotal.toFixed(2)}\n`;

    let finalTotal = subtotal;
    if (orderData.deliveryMethod === 'delivery') {
        orderDetails += `Delivery: $20.00\n`;
        finalTotal += 20;
        orderDetails += `Order Total: $${finalTotal.toFixed(2)}`;
    } else {
        orderDetails += `Shipping: Call for Cost\n`;
        orderDetails += `Order Total: Call for Total`;
    }

    const emailParams = {
        to_email: orderData.customerEmail,
        from_name: orderData.customerName,
        from_email: orderData.customerEmail,
        phone: orderData.customerPhone,
        delivery_method: orderData.deliveryMethod === 'delivery' ? 'Delivery' : 'Shipping',
        order_details: orderDetails,
        total: orderData.deliveryMethod === 'delivery' ? finalTotal.toFixed(2) : 'Call for Total'
    };

    // Check if EmailJS is configured
    if (typeof emailjs !== 'undefined' && emailjs) {
        emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', emailParams)
            .then(function(response) {
                alert('Order submitted successfully! You will receive a confirmation email shortly.');
                resetForm();
                closeModal();
            }, function(error) {
                console.log('EmailJS error:', error);
                downloadOrderAsCSV();
                alert('Order saved locally. Please send the downloaded file to the administrator.');
                resetForm();
                closeModal();
            });
    } else {
        // If no email service configured, just download CSV
        downloadOrderAsCSV();
        alert('Order saved locally. Please send the downloaded file to the administrator.');
        resetForm();
        closeModal();
    }
}

function downloadOrderAsCSV() {
    const customerName = document.getElementById('fullName').value;
    const customerEmail = document.getElementById('email').value;
    const customerPhone = document.getElementById('phone').value;
    const timestamp = new Date().toISOString();

    let csvContent = 'Order Date,Customer Name,Email,Phone,Item Description,Quantity,Price,Total\n';

    for (let key in orderItems) {
        const item = orderItems[key];
        const price = parseFloat(item.product.retail) || 0;
        const total = price * item.quantity;

        csvContent += `"${timestamp}","${customerName}","${customerEmail}","${customerPhone}","${item.product.item_description}",${item.quantity},${price.toFixed(2)},${total.toFixed(2)}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `order_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetForm() {
    document.getElementById('orderForm').reset();
    orderItems = {};
    updateOrderTotal();

    document.querySelectorAll('.qty-input').forEach(input => {
        input.value = 0;
    });

    document.getElementById('submitOrder').disabled = true;
}

window.onclick = function(event) {
    const modal = document.getElementById('confirmationModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}


