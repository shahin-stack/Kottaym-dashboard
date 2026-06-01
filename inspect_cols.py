import openpyxl

wb = openpyxl.load_workbook(r'c:\Users\SHAHIN\Desktop\Kottayam Dashboard\Kottayam Future Complete Data.xlsx', read_only=True)
ws = wb['Combined Sales Report']
row1 = next(ws.iter_rows(values_only=True))
print("Headers:", row1)
row2 = next(ws.iter_rows(values_only=True))
print("Sample Row:", row2)
wb.close()
