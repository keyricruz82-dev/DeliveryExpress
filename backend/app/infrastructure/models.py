from sqlalchemy import (
    Integer,
    String,
    Numeric,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    func,
    FetchedValue,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
)

class Base(DeclarativeBase):
    pass

class PedidoModel(Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    cliente_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    direccion_entrega: Mapped[str] = mapped_column(
        String(300),
        nullable=False,
    )

    total: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    estado: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pendiente",
    )

    fecha_creacion: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

class CategoriaModel(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    nombre: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    activa: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    productos: Mapped[list["ProductoModel"]] = relationship(
        back_populates="categoria",
    )

class ProductoModel(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    categoria_id: Mapped[int] = mapped_column(
        ForeignKey("categorias.id"),
        nullable=False,
        index=True,
    )

    nombre: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    descripcion: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    precio: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    imagen_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    disponible: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    fecha_creacion: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    categoria: Mapped["CategoriaModel"] = relationship(
        back_populates="productos",
    ) 
    
    
class DetallePedidoModel(Base):
    __tablename__ = "detalle_pedidos"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    pedido_id: Mapped[int] = mapped_column(
        ForeignKey("pedidos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    producto_id: Mapped[int] = mapped_column(
        ForeignKey("productos.id"),
        nullable=False,
        index=True,
    )

    cantidad: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    precio_unitario: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    subtotal: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        server_default=FetchedValue(),
    ) 
