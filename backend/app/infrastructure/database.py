from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.infrastructure.config import settings

if not settings.database_url:
    raise RuntimeError(
        "DATABASE_URL no está configurada. Revisa el archivo .env."
    )

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

def comprobar_conexion() -> str:
    """Comprueba la conexión con PostgreSQL."""
    with engine.connect() as conexion:
        return conexion.execute(
            text("SELECT current_database()")
        ).scalar_one()

def obtener_sesion():
    """Proporciona una sesión de base de datos y la cierra al terminar."""
    sesion = SessionLocal()
    try:
        yield sesion
    finally:
        sesion.close()