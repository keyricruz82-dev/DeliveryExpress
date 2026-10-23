from app.infrastructure.database import engine
from app.infrastructure.models import Base, PedidoModel

def inicializar_base_datos() -> None:
    """Crea las tablas declaradas que todavía no existen."""
    Base.metadata.create_all(bind=engine)
    print("Tablas verificadas correctamente en PostgreSQL.")

if __name__ == "__main__":
    inicializar_base_datos()
