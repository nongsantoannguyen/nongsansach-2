// Khởi tạo giỏ hàng
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartHeaderCount();

    // 1. Trang Giỏ hàng
    if (document.getElementById('cart-table-body')) {
        renderCartPage();
    }

    // 2. Trang Thanh toán
    if (document.getElementById('placeOrderBtn')) {
        renderCheckoutPage();
        document.getElementById('placeOrderBtn').addEventListener('click', handlePlaceOrder);
    }

    // 3. Gán sự kiện Thêm vào giỏ (Trang chủ & Chi tiết)
    document.querySelectorAll('.js-add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const product = {
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseInt(btn.dataset.price),
                image: btn.closest('.product-card')?.querySelector('img')?.src || '',
                quantity: 1
            };
            addToCart(product);
        });
    });
});

// --- LOGIC GIỎ HÀNG ---
function addToCart(product) {
    const index = cart.findIndex(item => item.id === product.id);
    index > -1 ? cart[index].quantity++ : cart.push(product);
    saveAndRefresh();
    alert(`Đã thêm ${product.name} vào giỏ!`);
}

function renderCartPage() {
    const tbody = document.getElementById('cart-table-body');
    let total = 0;
    tbody.innerHTML = cart.map((item, i) => {
        total += item.price * item.quantity;
        return `
        <tr>
            <td>${item.name}</td>
            <td>${item.price.toLocaleString()}đ</td>
            <td><input type="number" value="${item.quantity}" min="1" onchange="updateQty(${i}, this.value)"></td>
            <td>${(item.price * item.quantity).toLocaleString()}đ</td>
            <td><button onclick="removeItem(${i})" class="remove-btn">Xóa</button></td>
        </tr>`;
    }).join('');

    // Khớp ID với file gio-hang.html
    document.getElementById('cart-summary-subtotal').textContent = total.toLocaleString() + 'đ';
    document.getElementById('cart-summary-total').textContent = total.toLocaleString() + 'đ';
}

// --- LOGIC THANH TOÁN ---
function renderCheckoutPage() {
    const reviewList = document.getElementById('checkout-review-list');
    if (!reviewList) return; // Bảo vệ nếu không ở trang thanh toán

    let total = 0;
    reviewList.innerHTML = cart.map(item => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return `
            <div class="checkout-item" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>${item.name} x ${item.quantity}</span>
                <span>${subtotal.toLocaleString()}đ</span>
            </div>`;
    }).join('');

    // KHỚP ID ĐỂ HIỂN THỊ TẠM TÍNH VÀ TỔNG CỘNG
    const subtotalEl = document.getElementById('checkout-subtotal');
    const totalEl = document.getElementById('checkout-total-price');

    if (subtotalEl) subtotalEl.textContent = total.toLocaleString() + 'đ';
    if (totalEl) totalEl.textContent = total.toLocaleString() + 'đ';
}

function handlePlaceOrder() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzqQyl-PxnXKFPGBM6JLL30iE9YpDgFaRwaMosdYb0giqUloynJ6rXgQpY_5qtiDIlpvA/exec';
    const fName = document.getElementById('fullname'), fPhone = document.getElementById('phone'), fAddr = document.getElementById('address');

    // Hiệu ứng rung đỏ nếu trống
    let valid = true;
    [fName, fPhone, fAddr].forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('input-error');
            valid = false;
        } else {
            input.classList.remove('input-error');
        }
    });

    if (!valid) return alert("Toàn ơi, hãy nhập đủ thông tin nhé!");

    // Chuẩn bị dữ liệu (Tên biến phải khớp với Apps Script ở trên)
    const orderData = {
        customerName: document.getElementById('fullname').value,
        customerPhone: document.getElementById('phone').value,
        customerAddress: document.getElementById('address').value,
        items: cart.map(item => `${item.name} (x${item.quantity})`).join(', '),
        totalPrice: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    alert("Đang gửi đơn hàng...");

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', // Dùng cái này để tránh lỗi CORS khi test nhanh
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    })
        .then(() => {
            alert("Đặt hàng thành công! Kiểm tra Telegram và Sheet nhé Toàn.");
            localStorage.removeItem('cart');
            window.location.href = 'index.html';
        })
        .catch(err => alert("Lỗi gửi đơn: " + err));

}

// Hàm bổ trợ
function updateQty(i, q) { cart[i].quantity = parseInt(q); saveAndRefresh(); }
function removeItem(i) { cart.splice(i, 1); saveAndRefresh(); }
function saveAndRefresh() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartHeaderCount();
    if (document.getElementById('cart-table-body')) renderCartPage();
}
function updateCartHeaderCount() {
    const el = document.getElementById('cartCount');
    if (el) el.textContent = cart.reduce((s, i) => s + i.quantity, 0);
}

// Đảm bảo trang thanh toán luôn load dữ liệu khi vừa mở ra
if (window.location.pathname.includes('thanh-toan.html')) {
    renderCheckoutPage();
}