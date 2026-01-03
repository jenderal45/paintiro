// ==========================
// ARTIVA SAAS - ONE FILE
// ==========================

import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";

const app = express();
const stripe = new Stripe("sk_test_GANTI_DENGAN_STRIPE_KEY_ANDA");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==========================
// DATABASE SEMENTARA (IN-MEMORY)
// ==========================
let PRODUCTS = [
  { id: 1, title: "Golden Horizon", price: 1200000, image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19" },
  { id: 2, title: "Abstract Emotion", price: 950000, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee" }
];

const ADMIN = { username: "admin", password: "admin123" };

// ==========================
// FRONTEND
// ==========================
app.get("/", (req, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<title>ARTIVA – Fine Art Marketplace</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
body{font-family:Arial;background:#f4f4f4;margin:0}
header{padding:20px;background:#111;color:#fff;text-align:center}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;padding:20px}
.card{background:#fff;padding:10px;border-radius:8px}
.card img{width:100%;height:200px;object-fit:cover}
button{padding:10px;width:100%;background:#111;color:#fff;border:none;cursor:pointer}
.cart{position:fixed;top:20px;right:20px;background:#000;color:#fff;padding:10px}
@media(max-width:600px){header h1{font-size:20px}}
</style>
</head>
<body>

<header>
<h1>ARTIVA – Luxury Art Commerce</h1>
<p>Exclusive paintings marketplace</p>
</header>

<div class="cart">
Cart: <span id="count">0</span>
<button onclick="checkout()">Checkout</button>
</div>

<div class="grid" id="list"></div>

<script>
let cart=[];
fetch("/products").then(r=>r.json()).then(d=>{
  const el=document.getElementById("list");
  d.forEach(p=>{
    el.innerHTML+=\`
    <div class="card">
      <img src="\${p.image}">
      <h3>\${p.title}</h3>
      <p>Rp \${p.price.toLocaleString()}</p>
      <button onclick='add(\${JSON.stringify(p)})'>Add to Cart</button>
    </div>\`;
  });
});

function add(p){
 cart.push(p);
 document.getElementById("count").innerText=cart.length;
}

function checkout(){
 fetch("/checkout",{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify(cart)})
 .then(r=>r.json()).then(d=>location.href=d.url);
}
</script>

</body>
</html>
`);
});

// ==========================
// API
// ==========================
app.get("/products", (req,res)=>res.json(PRODUCTS));

app.post("/checkout", async (req,res)=>{
  const items=req.body;
  const session = await stripe.checkout.sessions.create({
    payment_method_types:["card"],
    line_items: items.map(i=>({
      price_data:{
        currency:"idr",
        product_data:{name:i.title},
        unit_amount:i.price
      },
      quantity:1
    })),
    mode:"payment",
    success_url:"http://localhost:3000/success",
    cancel_url:"http://localhost:3000"
  });
  res.json({url:session.url});
});

// ==========================
// ADMIN LOGIN
// ==========================
app.get("/admin",(req,res)=>{
res.send(`
<form method="post" action="/admin">
<h2>Admin Login</h2>
<input name="username" placeholder="username"/><br>
<input name="password" type="password" placeholder="password"/><br>
<button>Login</button>
</form>
`);
});

app.post("/admin",(req,res)=>{
 const {username,password}=req.body;
 if(username===ADMIN.username && password===ADMIN.password){
  res.redirect("/admin/dashboard");
 }else res.send("Login failed");
});

// ==========================
// ADMIN PANEL
// ==========================
app.get("/admin/dashboard",(req,res)=>{
res.send(`
<h1>Admin Dashboard</h1>
<form method="post" action="/admin/add">
<input name="title" placeholder="Title"/><br>
<input name="price" placeholder="Price"/><br>
<input name="image" placeholder="Image URL"/><br>
<button>Add Product</button>
</form>
<hr>
<ul>
${PRODUCTS.map(p=>`<li>${p.title} - Rp ${p.price}</li>`).join("")}
</ul>
`);
});

app.post("/admin/add",(req,res)=>{
 PRODUCTS.push({id:Date.now(),...req.body,price:Number(req.body.price)});
 res.redirect("/admin/dashboard");
});

// ==========================
// SUCCESS PAGE
// ==========================
app.get("/success",(req,res)=>{
res.send("<h1>Payment Successful ✔</h1><a href='/'>Back</a>");
});

// ==========================
app.listen(3000,()=>console.log("ARTIVA running http://localhost:3000"));
