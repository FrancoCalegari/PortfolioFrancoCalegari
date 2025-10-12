import json
import os
import tkinter as tk
from tkinter import messagebox, filedialog
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
# Formularios (Agregar / Editar)
# ========================
def open_form(mode="add"):
    """Abre una ventana para agregar o editar proyecto."""
    selected_index = None
    data = {
        "name": "",
        "description": "",
        "url": "",
        "image": "",
        "alt": "",
        "destacado": 0
    }

    if mode == "edit":
        selected_item = tree.selection()
        if not selected_item:
            messagebox.showwarning("Selecciona un proyecto", "Debes seleccionar un proyecto para editar.")
            return
        selected_index = int(tree.item(selected_item)["text"])
        projects = load_projects()
        data = projects[selected_index]

    form = tk.Toplevel(root)
    form.title("Formulario de Proyecto")
    form.geometry("400x420")
    form.resizable(False, False)

    # Campos
    tk.Label(form, text="Nombre:").pack(anchor="w", padx=10, pady=2)
    entry_name = tk.Entry(form, width=50)
    entry_name.insert(0, data["name"])
    entry_name.pack(padx=10, pady=2)

    tk.Label(form, text="Descripción:").pack(anchor="w", padx=10, pady=2)
    entry_desc = tk.Text(form, width=50, height=4)
    entry_desc.insert("1.0", data["description"])
    entry_desc.pack(padx=10, pady=2)

    tk.Label(form, text="URL del Proyecto:").pack(anchor="w", padx=10, pady=2)
    entry_url = tk.Entry(form, width=50)
    entry_url.insert(0, data["url"])
    entry_url.pack(padx=10, pady=2)

    tk.Label(form, text="Imagen (path o URL):").pack(anchor="w", padx=10, pady=2)
    entry_img = tk.Entry(form, width=50)
    entry_img.insert(0, data["image"])
    entry_img.pack(padx=10, pady=2)

    tk.Label(form, text="Texto alternativo (alt):").pack(anchor="w", padx=10, pady=2)
    entry_alt = tk.Entry(form, width=50)
    entry_alt.insert(0, data["alt"])
    entry_alt.pack(padx=10, pady=2)

    destacado_var = tk.IntVar(value=data["destacado"])
    tk.Checkbutton(form, text="¿Proyecto destacado?", variable=destacado_var).pack(anchor="w", padx=10, pady=5)

    # Guardar cambios
    def save():
        name = entry_name.get().strip()
        description = entry_desc.get("1.0", "end").strip()
        url = entry_url.get().strip()
        image = entry_img.get().strip()
        alt = entry_alt.get().strip()
        destacado = destacado_var.get()

        if not name:
            messagebox.showerror("Error", "El campo 'Nombre' es obligatorio.")
            return

        projects = load_projects()

        if mode == "add":
            projects.append({
                "name": name,
                "description": description,
                "url": url,
                "image": image,
                "alt": alt,
                "destacado": destacado
            })
            save_projects(projects)
            messagebox.showinfo("Éxito", f"Proyecto '{name}' agregado correctamente.")
        else:
            projects[selected_index] = {
                "name": name,
                "description": description,
                "url": url,
                "image": image,
                "alt": alt,
                "destacado": destacado
            }
            save_projects(projects)
            messagebox.showinfo("Éxito", f"Proyecto '{name}' actualizado correctamente.")

        refresh_treeview()
        form.destroy()

    tk.Button(form, text="Guardar", width=15, bg="#4CAF50", fg="white", command=save).pack(pady=15)
    tk.Button(form, text="Cancelar", width=15, command=form.destroy).pack()

# ========================
# CRUD básicos
# ========================
def add_project():
    open_form("add")

def update_project():
    open_form("edit")

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
# Interfaz principal
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

btn_frame = tk.Frame(root)
btn_frame.pack(pady=10)

tk.Button(btn_frame, text="Importar JSON", command=import_json, width=20).pack(side="left", padx=5)
tk.Button(btn_frame, text="Agregar Proyecto", command=add_project, width=20).pack(side="left", padx=5)
tk.Button(btn_frame, text="Actualizar Proyecto", command=update_project, width=20).pack(side="left", padx=5)
tk.Button(btn_frame, text="Eliminar Proyecto", command=delete_project, width=20).pack(side="left", padx=5)

columns = ("Nombre", "Descripción", "URL", "Imagen", "Alt", "Destacado")
tree = ttk.Treeview(root, columns=columns, show="headings")
for col in columns:
    tree.heading(col, text=col)
    tree.column(col, width=150)

tree.pack(fill="both", expand=True)

root.mainloop()
