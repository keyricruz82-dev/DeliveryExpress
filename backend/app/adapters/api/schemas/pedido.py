
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductoPedidoCrear(BaseModel):
    producto_id: int = Field(gt=0)
    cantidad: int = Field(gt=0)


class PedidoCrear(BaseModel):
    cliente_id: int = Field(gt=0)
    direccion_entrega: str = Field(min_length=5, max_length=300)
    productos: list[ProductoPedidoCrear] = Field(min_length=1)


class PedidoRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    cliente_id: int
    direccion_entrega: str
    total: Decimal
    estado: str
    fecha_creacion: datetime
