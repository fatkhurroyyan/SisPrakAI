import re
import uuid

input_file = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\991707cc-b674-42b0-a230-54eebd9e0664\scratch\extracted_content.txt'
output_sql = '../supabase/migrations/003_seed_data.sql'

sql_statements = []
sql_statements.append("-- Migration: 003_seed_data.sql\n")

# Seed Kelas
kelas_files = [
    'D4SM-49-01',
    'D4SM-49-02',
    'D4SM-49-03',
    'D4SM-49-04',
    'D4SM-49-05'
]

kelas_map = {}
for kode_kelas in kelas_files:
    k_id = str(uuid.uuid4())
    kelas_map[kode_kelas] = k_id
    sql_statements.append(f"INSERT INTO kelas (id, kode, nama) VALUES ('{k_id}', '{kode_kelas}', 'Kelas {kode_kelas}');")

sql_statements.append("\n-- Seed Users (Praktikan)")

current_kelas = None

with open(input_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if line.startswith('FILE: D4SM-49-'):
            current_kelas = line.replace('FILE: ', '').replace('.xlsx', '').strip()
        elif line.startswith('Row '):
            # Parse row data like: Row 4: [A4]=1 | [B4]=707022500001 | [C4]='SITI RAHMA SHAFIRA'
            if '[B' in line and '[C' in line:
                try:
                    # extract NIM
                    nim_part = line.split('|')[1].strip()
                    nim = nim_part.split('=')[1].strip().replace("'", "")
                    
                    # extract Nama
                    nama_part = line.split('|')[2].strip()
                    nama = nama_part.split('=')[1].strip().replace("'", "''")
                    
                    if nim and nim.lower() != 'nim' and nim.isdigit():
                        u_id = str(uuid.uuid4())
                        k_id = kelas_map.get(current_kelas)
                        if k_id:
                            sql_statements.append(f"INSERT INTO users (id, nim, nama, role, kelas_id) VALUES ('{u_id}', '{nim}', '{nama}', 'praktikan', '{k_id}');")
                except Exception as e:
                    pass

sql_statements.append("\n-- Seed Modul")
modul_data = [
    (1, "MOD-01", "Pengantar Artificial Intelligence"),
    (2, "MOD-02", "Pencarian Buta (Blind Search) - Breadth First Search (BFS) dan Depth First Search (DFS)"),
    (3, "MOD-03", "Pencarian Heuristik (Heuristic Search)"),
    (4, "MOD-04", "Logika Fuzzy (Fuzzy Logic)"),
    (5, "MOD-05", "Jaringan Syaraf Tiruan (Artificial Neural Network/ANN)"),
    (6, "MOD-06", "Algoritma Genetika (Genetic Algorithm)"),
    (7, "MOD-07", "Machine Learning - Supervised Learning"),
    (8, "MOD-08", "Machine Learning - Unsupervised Learning"),
    (9, "MOD-09", "Deep Learning - Convolutional Neural Network (CNN)"),
    (10, "MOD-10", "Natural Language Processing (NLP) - Text Classification"),
    (11, "MOD-11", "Expert System (Sistem Pakar)")
]
for m in modul_data:
    sql_statements.append(f"INSERT INTO modul (nomor, kode, judul, minggu) VALUES ({m[0]}, '{m[1]}', '{m[2]}', {m[0]});")

# Seed Asprak (dummy data)
sql_statements.append("\n-- Seed Users (Asprak)")
asprak_id = str(uuid.uuid4())
sql_statements.append(f"INSERT INTO users (id, nim, nama, role) VALUES ('{asprak_id}', 'ASPRAK01', 'Asisten Praktikum AI 01', 'asprak');")

with open(output_sql, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_statements))

print("Seed data generated successfully.")
