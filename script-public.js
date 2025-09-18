let products = [];
let orderItems = {};

const GOOGLE_SHEET_ID = 'YOUR_SHEET_ID_HERE';
const GOOGLE_SHEET_RANGE = 'Sheet1!A:D';

document.addEventListener('DOMContentLoaded', function() {
    emailjs.init("YOUR_EMAILJS_PUBLIC_KEY");

    document.getElementById('fullName').addEventListener('blur', validateName);
    document.getElementById('email').addEventListener('blur', validateEmail);
    document.getElementById('phone').addEventListener('blur', validatePhone);
    document.getElementById('submitOrder').addEventListener('click', showConfirmation);
    document.getElementById('confirmSubmit').addEventListener('click', submitOrder);
    document.getElementById('cancelSubmit').addEventListener('click', closeModal);
    document.querySelector('.close').addEventListener('click', closeModal);

    loadProductsFromGoogleSheet();
});

function loadProductsFromGoogleSheet() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${GOOGLE_SHEET_RANGE}?key=YOUR_API_KEY_HERE`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load products from Google Sheet');
            }
            return response.json();
        })
        .then(data => {
            if (data.values && data.values.length > 0) {
                parseGoogleSheetData(data.values);
                document.getElementById('loadingMessage').style.display = 'none';
            } else {
                throw new Error('No data found in Google Sheet');
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            document.getElementById('loadingMessage').innerHTML = `
                <p style="color: #e74c3c;">Error loading products. Please check configuration.</p>
                <p style="font-size: 14px; color: #666;">Make sure the Google Sheet is published and the API key is configured.</p>
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

    products.forEach((product, index) => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

        const imageUrl = getImageUrl(product.image);
        const price = parseFloat(product.price) || 0;
        const minQty = parseInt(product.minimum_order_quantity) || 1;

        productCard.innerHTML = `
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.item_description}" onerror="this.src='images/placeholder.png'">
            </div>
            <div class="product-info">
                <h3>${product.item_description}</h3>
                <p class="price">$${price.toFixed(2)}</p>
                <p class="min-qty">Minimum Order: ${minQty}</p>
                <div class="quantity-control">
                    <button class="qty-btn minus" data-index="${index}">-</button>
                    <input type="number" class="qty-input" id="qty-${index}"
                           min="0" step="${minQty}" value="0" data-index="${index}">
                    <button class="qty-btn plus" data-index="${index}">+</button>
                </div>
            </div>
        `;

        container.appendChild(productCard);
    });

    attachQuantityListeners();
}

function getImageUrl(imageValue) {
    if (!imageValue) return 'images/placeholder.png';

    if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
        return imageValue;
    }

    const extensions = ['.jpg', '.png', '.jpeg'];
    for (let ext of extensions) {
        if (imageValue.toLowerCase().includes(ext)) {
            return imageValue;
        }
    }

    for (let ext of ['.jpg', '.png']) {
        const imagePath = `images/${imageValue.toLowerCase()}${ext}`;
        return imagePath;
    }

    return 'images/placeholder.png';
}

function attachQuantityListeners() {
    document.querySelectorAll('.qty-btn.minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.dataset.index;
            const input = document.getElementById(`qty-${index}`);
            const minQty = parseInt(products[index].minimum_order_quantity) || 1;
            const currentValue = parseInt(input.value) || 0;

            if (currentValue >= minQty) {
                input.value = Math.max(0, currentValue - minQty);
                updateOrderItem(index, input.value);
            }
        });
    });

    document.querySelectorAll('.qty-btn.plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = this.dataset.index;
            const input = document.getElementById(`qty-${index}`);
            const minQty = parseInt(products[index].minimum_order_quantity) || 1;
            const currentValue = parseInt(input.value) || 0;

            input.value = currentValue + minQty;
            updateOrderItem(index, input.value);
        });
    });

    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', function() {
            const index = this.dataset.index;
            const minQty = parseInt(products[index].minimum_order_quantity) || 1;
            let value = parseInt(this.value) || 0;

            if (value > 0 && value % minQty !== 0) {
                value = Math.round(value / minQty) * minQty;
                this.value = value;
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
    let total = 0;

    for (let key in orderItems) {
        const item = orderItems[key];
        const price = parseFloat(item.product.price) || 0;
        total += price * item.quantity;
    }

    document.getElementById('totalAmount').textContent = total.toFixed(2);
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

    const modal = document.getElementById('confirmationModal');
    const details = document.getElementById('confirmationDetails');

    let orderHtml = '<h3>Customer Information</h3>';
    orderHtml += `<p><strong>Name:</strong> ${document.getElementById('fullName').value}</p>`;
    orderHtml += `<p><strong>Email:</strong> ${document.getElementById('email').value}</p>`;
    orderHtml += `<p><strong>Phone:</strong> ${document.getElementById('phone').value}</p>`;

    orderHtml += '<h3>Order Items</h3>';
    orderHtml += '<table class="order-summary"><thead><tr><th>Item</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead><tbody>';

    let grandTotal = 0;
    for (let key in orderItems) {
        const item = orderItems[key];
        const price = parseFloat(item.product.price) || 0;
        const total = price * item.quantity;
        grandTotal += total;

        orderHtml += `<tr>
            <td>${item.product.item_description}</td>
            <td>${item.quantity}</td>
            <td>$${price.toFixed(2)}</td>
            <td>$${total.toFixed(2)}</td>
        </tr>`;
    }

    orderHtml += `</tbody></table>`;
    orderHtml += `<h3>Total: $${grandTotal.toFixed(2)}</h3>`;

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

    let orderDetails = `Customer Information:\n`;
    orderDetails += `Name: ${customerName}\n`;
    orderDetails += `Email: ${customerEmail}\n`;
    orderDetails += `Phone: ${customerPhone}\n\n`;

    orderDetails += `Order Items:\n`;
    orderDetails += `----------------------------------------\n`;

    let grandTotal = 0;
    for (let key in orderItems) {
        const item = orderItems[key];
        const price = parseFloat(item.product.price) || 0;
        const total = price * item.quantity;
        grandTotal += total;

        orderDetails += `${item.product.item_description}\n`;
        orderDetails += `Quantity: ${item.quantity} @ $${price.toFixed(2)} each = $${total.toFixed(2)}\n`;
        orderDetails += `----------------------------------------\n`;
    }

    orderDetails += `\nOrder Total: $${grandTotal.toFixed(2)}`;

    const emailParams = {
        to_email: customerEmail,
        from_name: customerName,
        from_email: customerEmail,
        phone: customerPhone,
        order_details: orderDetails,
        total: grandTotal.toFixed(2)
    };

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
}

function downloadOrderAsCSV() {
    const customerName = document.getElementById('fullName').value;
    const customerEmail = document.getElementById('email').value;
    const customerPhone = document.getElementById('phone').value;
    const timestamp = new Date().toISOString();

    let csvContent = 'Order Date,Customer Name,Email,Phone,Item Description,Quantity,Price,Total\n';

    for (let key in orderItems) {
        const item = orderItems[key];
        const price = parseFloat(item.product.price) || 0;
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