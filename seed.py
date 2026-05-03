import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
inventory_table = dynamodb.Table('Inventory')

products = [
    {"name": "Wireless Noise-Cancelling Headphones", "price": Decimal("2999.00"), "stock": 50, "category": "Electronics", "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"},
    {"name": "Mechanical Gaming Keyboard", "price": Decimal("1499.00"), "stock": 35, "category": "Electronics", "image": "https://images.unsplash.com/photo-1595225476474-87563907a212?w=400"},
    {"name": "Ergonomic Office Chair", "price": Decimal("8999.00"), "stock": 15, "category": "Furniture", "image": "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400"},
    {"name": "Stainless Steel Water Bottle", "price": Decimal("599.00"), "stock": 100, "category": "Lifestyle", "image": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400"},
    {"name": "Running Shoes - Air Cushion", "price": Decimal("3499.00"), "stock": 40, "category": "Sports", "image": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"},
    {"name": "Portable Bluetooth Speaker", "price": Decimal("1999.00"), "stock": 60, "category": "Electronics", "image": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400"},
    {"name": "Cotton Casual Hoodie", "price": Decimal("899.00"), "stock": 80, "category": "Clothing", "image": "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400"},
    {"name": "Smart LED Desk Lamp", "price": Decimal("1299.00"), "stock": 45, "category": "Electronics", "image": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"},
]

print("Seeding inventory...")
for p in products:
    item = {
        'productId': str(uuid.uuid4()),
        'name': p['name'],
        'price': p['price'],
        'stock': p['stock'],
        'category': p['category'],
        'image': p['image'],
        'createdAt': datetime.utcnow().isoformat()
    }
    inventory_table.put_item(Item=item)
    print(f"  Added: {p['name']}")

print(f"\nDone! {len(products)} products added.")