import json
import os
import tkinter as tk
from tkinter import messagebox, simpledialog, filedialog
from tkinter import ttk

JSON_FILE = None  # Se definirá al importar un JSON

# ========================
# Funciones para manejar JSON
# ========================
def load_projects():
    global JSON_FILE
    if not JSON_FILE:
        return []
    if not os.path.exists(JSON_FILE):
        with open(JSON_FILE, "w") as f:
            json.dump({"projects": []}, f, indent=4)
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        return json.load(f).get("projects", [])

def save_projects(projects):
    global JSON_FILE
    if not JSON_FILE:
        messagebox.showerror("Error", "Primero debes importar un archivo JSON.")
        return
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump({"projects": projects}, f, indent=4, ensure_ascii=False)

# ========================
# CRUD
# ========================
def add_project():
    projects = load_projects()
    name = simpledialog.askstring("Nuevo Proyecto", "Nombre del proyecto:")
    if not name:
        return
    description = simpledialog.askstring("Nuevo Proyecto", "Descripción:")
    url = simpledialog.askstring("Nuevo Proyecto", "URL del proyecto:")
    image = simpledialog.askstring("Nuevo Proyecto", "URL o path de imagen:")
    alt = simpledialog.askstring("Nuevo Proyecto", "Texto alternativo de la imagen:")
    destacado = messagebox.askyesno("Nuevo Proyecto", "¿Es destacado?")

    projects.append({
        "name": name,
        "description": description,
        "url": url,
        "image": image,
        "alt": alt,
        "destacado": 1 if destacado else 0
    })
    save_projects(projects)
    refresh_treeview()
    messagebox.showinfo("Éxito", f"Proyecto '{name}' agregado correctamente.")

def update_project():
    selected_item = tree.selection()
    if not selected_item:
        messagebox.showwarning("Selecciona un proyecto", "Debes seleccionar un proyecto para actualizar.")
        return
    index = int(tree.item(selected_item)["text"])
    projects = load_projects()
    project = projects[index]

    project["name"] = simpledialog.askstring("Actualizar Proyecto", "Nombre:", initialvalue=project["name"])
    project["description"] = simpledialog.askstring("Actualizar Proyecto", "Descripción:", initialvalue=project["description"])
    project["url"] = simpledialog.askstring("Actualizar Proyecto", "URL:", initialvalue=project["url"])
    project["image"] = simpledialog.askstring("Actualizar Proyecto", "URL o path de imagen:", initialvalue=project["image"])
    project["alt"] = simpledialog.askstring("Actualizar Proyecto", "Texto alternativo:", initialvalue=project["alt"])
    project["destacado"] = 1 if messagebox.askyesno("Actualizar Proyecto", "¿Es destacado?") else 0

    projects[index] = project
    save_projects(projects)
    refresh_treeview()
    messagebox.showinfo("Éxito", f"Proyecto '{project['name']}' actualizado.")

def delete_project():
    selected_item = tree.selection()
    if not selected_item:
        messagebox.showwarning("Selecciona un proyecto", "Debes seleccionar un proyecto para eliminar.")
        return
    index = int(tree.item(selected_item)["text"])
    projects = load_projects()
    project = projects.pop(index)
    save_projects(projects)
    refresh_treeview()
    messagebox.showinfo("Éxito", f"Proyecto '{project['name']}' eliminado.")

# ========================
# Importar JSON
# ========================
def import_json():
    global JSON_FILE
    file_path = filedialog.askopenfilename(title="Seleccionar archivo JSON", filetypes=[("JSON Files", "*.json")])
    if not file_path:
        return
    JSON_FILE = file_path
    refresh_treeview()
    messagebox.showinfo("Importado", f"Archivo JSON cargado:\n{JSON_FILE}")

# ========================
# Interfaz Gráfica
# ========================
def refresh_treeview():
    for item in tree.get_children():
        tree.delete(item)
    projects = load_projects()
    for i, proj in enumerate(projects):
        tree.insert("", "end", text=str(i), values=(
            proj.get("name", ""),
            proj.get("description", ""),
            proj.get("url", ""),
            proj.get("image", ""),
            proj.get("alt", ""),
            proj.get("destacado", 0)
        ))

root = tk.Tk()
root.title("Gestión de Proyectos")
root.geometry("950x500")

# Botones CRUD + Importar
btn_frame = tk.Frame(root)
btn_frame.pack(pady=10)

tk.Button(btn_frame, text="Importar JSON", command=import_json, width=20).pack(side="left", padx=5)
tk.Button(btn_frame, text="Agregar Proyecto", command=add_project, width=20).pack(side="left", padx=5)
tk.Button(btn_frame, text="Actualizar Proyecto", command=update_project, width=20).pack(side="left", padx=5)
tk.Button(btn_frame, text="Eliminar Proyecto", command=delete_project, width=20).pack(side="left", padx=5)

# Tabla de proyectos
columns = ("Nombre", "Descripción", "URL", "Imagen", "Alt", "Destacado")
tree = ttk.Treeview(root, columns=columns, show="headings")
for col in columns:
    tree.heading(col, text=col)
    tree.column(col, width=150)

tree.pack(fill="both", expand=True)

root.mainloop()
