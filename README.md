# Delivery Express — Sistema de Gestión de Pedidos y Delivery

Proyecto académico inicial. Tecnologías propuestas:
- Frontend: React + Vite
- Backend: Python 3.12 + FastAPI
- Base de datos: PostgreSQL administrado en la nube (propuesta: Supabase)
- Repositorio: Git + GitHub

## Estructura
- `frontend/`: interfaz web React
- `backend/`: API organizada siguiendo Clean Architecture
- `docs/`: documentación del proyecto

## Requisitos
- Python 3.12 o compatible
- Node.js LTS y npm
- Git (recomendado)
- Una base PostgreSQL en la nube para la siguiente etapa

## Iniciar el backend (PowerShell)
```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```
Documentación interactiva de la API durante desarrollo: `http://127.0.0.1:8000/docs`.

## Iniciar el frontend (PowerShell, en otra terminal)
```powershell
cd frontend
npm install
npm run dev
```
Vite mostrará la dirección local del frontend.

## Configuración
- Copiar `backend/.env.example` a `backend/.env` y completar valores cuando se conecte la base de datos.
- Copiar `frontend/.env.example` a `frontend/.env` si se desea configurar otra URL de API.
- No subir archivos `.env`, contraseñas ni tokens a GitHub.
- La base de datos del proyecto debe estar alojada en la nube; la dirección local del backend se usa únicamente para desarrollo.

## Estado inicial
Esta versión contiene el esqueleto del proyecto y un endpoint de comprobación (`/api/health`). Aún no implementa registro, autenticación, catálogo, pedidos ni los demás RF.
