import sqlite3
import openpyxl
from datetime import datetime

# Connect to SQLite
conn = sqlite3.connect('catchment.db')
cursor = conn.cursor()

# Create table
cursor.execute('''
CREATE TABLE IF NOT EXISTS sales (
    branch TEXT,
    rbm TEXT,
    bdm TEXT,
    date TEXT,
    time TEXT,
    invoice_number TEXT,
    customer_name TEXT,
    customer_mobile TEXT,
    pincode TEXT,
    state TEXT,
    staff TEXT,
    product TEXT,
    category TEXT,
    brand TEXT,
    item_group TEXT,
    item_category TEXT,
    item_code TEXT,
    item_name TEXT,
    imei TEXT,
    qty INTEGER,
    financier TEXT,
    finance TEXT,
    delivery_order_no TEXT,
    emi TEXT,
    mop TEXT,
    sold_price REAL,
    tax_pct REAL,
    taxable_value REAL,
    tax REAL,
    margin_money REAL,
    down_payment REAL,
    processing_charge REAL,
    service_charge REAL,
    dbd_charge REAL,
    indirect_discount REAL,
    direct_discount REAL,
    buyback_amount REAL,
    addition REAL,
    deduction REAL
)
''')

# Read Excel and insert
print("Reading Excel...")
wb = openpyxl.load_workbook(r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\Changn,kottym,thiru,nagam Complete data.xlsx', read_only=True)
ws = wb.active

count = 0
batch = []
for idx, row in enumerate(ws.iter_rows(values_only=True)):
    if idx == 0:
        continue # skip header
    
    # parse date if needed, or just keep as string
    date_val = row[3]
    if isinstance(date_val, datetime):
        date_val = date_val.strftime('%Y-%m-%d')
    elif date_val:
        date_val = str(date_val)
        
    row_vals = list(row)
    row_vals[3] = date_val
    
    # Cast quantities and floats where appropriate, or let SQLite handle it since it uses dynamic typing
    # But just in case, ensure length is 39
    if len(row_vals) < 39:
        row_vals.extend([None] * (39 - len(row_vals)))
    elif len(row_vals) > 39:
        row_vals = row_vals[:39]
        
    batch.append(row_vals)
    count += 1
    
    if count % 10000 == 0:
        cursor.executemany('INSERT INTO sales VALUES (' + ','.join(['?']*39) + ')', batch)
        conn.commit()
        batch = []
        print(f"Inserted {count} rows...")

if batch:
    cursor.executemany('INSERT INTO sales VALUES (' + ','.join(['?']*39) + ')', batch)
    conn.commit()

wb.close()
conn.close()
print(f"Done. Total rows inserted: {count}")
